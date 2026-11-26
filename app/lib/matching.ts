// ルールベースのマッチング判定（決定的・説明可能）
// 形は schema.md の判定フローに対応: ハードフィルター → 返済比率 → タグルール加減点 → 鮮度
// すべての銀行データは「未確認（動画メモ 2020〜2023由来）」前提で扱う。

import { INSTITUTIONS, type Institution } from "./banks";

export type EmploymentType = "regular" | "contract" | "dispatch" | "self_employed" | "executive";
export type FamilyType = "single" | "couple" | "with_children";
export type PropertyType = "condo" | "house";

export interface MatchInput {
  incomeMan: number; // 年収（万円）
  age: number;
  family: FamilyType;
  employment: EmploymentType;
  tenureMonths: number; // 勤続（か月）
  loanAmountMan: number; // 借入希望額（万円）
  termYears: number; // 返済期間（年）
  prefecture: string;
  propertyType: PropertyType;
  buildingAgeYears: number; // 築年数
  areaSqm: number; // 面積㎡
  isLeasehold: boolean; // 借地権（物件属性）
  isNonRebuildable: boolean; // 再建築不可（物件属性）
  selfFundRatio: number; // 自己資金割合（%）
  tags: string[]; // 訳ありタグ code
}

export interface MatchResult {
  institution: Institution;
  score: number;
  excluded: boolean;
  excludeReasons: string[];
  reasons: string[];
  cautions: string[];
  /** 審査金利で計算した返済比率(%)。計算できない場合は null */
  repaymentRatio: number | null;
  repaymentRatioNote: string;
  monthlyPaymentMan: number | null; // 月返済額の目安（万円）
}

export const EMPLOYMENT_LABELS: Record<EmploymentType, string> = {
  regular: "正社員",
  contract: "契約社員",
  dispatch: "派遣社員",
  self_employed: "自営業・フリーランス",
  executive: "会社役員",
};

/** 元利均等返済の月返済額（万円）。ratePct は年利(%) */
export function monthlyPayment(principalMan: number, ratePct: number, years: number): number {
  const r = ratePct / 100 / 12;
  const n = years * 12;
  if (r === 0) return principalMan / n;
  const f = Math.pow(1 + r, n);
  return (principalMan * r * f) / (f - 1);
}

function ratioCalc(inst: Institution, input: MatchInput): { ratio: number | null; monthly: number | null; note: string } {
  const f = inst.facts;
  if (f.screeningRateBasis === "execution") {
    return {
      ratio: null,
      monthly: null,
      note: "実行金利で返済比率を計算する方式（動画メモ）。実行金利自体が未確認のため、ここでは目安計算をしていません。審査金利方式の銀行より比率上は有利になり得ます。",
    };
  }
  if (f.screeningRate == null) {
    return { ratio: null, monthly: null, note: "審査金利が動画メモにないため、返済比率の目安計算はできません。" };
  }
  const monthly = monthlyPayment(input.loanAmountMan, f.screeningRate, input.termYears);
  const ratio = ((monthly * 12) / input.incomeMan) * 100;
  let note = `審査金利 ${f.screeningRate}%（未確認・動画メモ）で計算した目安です。`;
  if (f.repaymentRatioMax != null) {
    note += ` 動画メモの上限目安は ${f.repaymentRatioMax}%${f.repaymentRatioNote ? `（${f.repaymentRatioNote}）` : ""}。`;
  }
  return { ratio, monthly, note };
}

export function matchInstitutions(input: MatchInput): MatchResult[] {
  const results: MatchResult[] = INSTITUTIONS.map((inst) => {
    const f = inst.facts;
    let score = 50;
    const excluded = { value: false };
    const excludeReasons: string[] = [];
    const reasons: string[] = [];
    const cautions: string[] = [...inst.cautions];

    const hardExclude = (msg: string) => {
      excluded.value = true;
      excludeReasons.push(msg);
    };
    const penalty = (pts: number, msg: string) => {
      score -= pts;
      cautions.push(msg);
    };
    const bonus = (pts: number, msg: string) => {
      score += pts;
      reasons.push(msg);
    };

    // --- ハードフィルター: 地域 ---
    if (f && inst.regions && !inst.regions.includes(input.prefecture)) {
      hardExclude(`対象地域外（${inst.areaNote}）。この物件の都道府県（${input.prefecture}）は対象外です。`);
    }
    // --- ハードフィルター: 最低年収 ---
    if (f.minIncomeMan != null && input.incomeMan < f.minIncomeMan) {
      hardExclude(`最低年収の目安 ${f.minIncomeMan}万円 に対し、入力年収 ${input.incomeMan}万円 が届いていません。`);
    }
    // --- ハードフィルター: 雇用形態 ---
    if (input.employment === "dispatch") {
      if (f.acceptsDispatch === false) hardExclude("派遣社員は取扱いなし（動画メモ）。");
      else if (f.acceptsDispatch === true) bonus(30, "派遣社員でも通る数少ない銀行（動画メモ）");
      else if (f.acceptsDispatch === "conditional") bonus(10, "派遣社員も社会保険加入なら可（動画メモ）");
    }
    if (input.employment === "contract") {
      if (f.acceptsContract === false) hardExclude("契約社員は取扱いなし（動画メモ）。");
      else if (f.acceptsContract === "conditional") {
        if (inst.id === "smbc") {
          if (input.tenureMonths >= 36) bonus(5, "契約社員でも勤続3年以上などの条件を満たせば可（動画メモ）");
          else penalty(25, "契約社員は勤続3年以上・月給制・更新1年以上等が条件（動画メモ）で、現入力では届いていません。");
        } else {
          bonus(10, "契約社員も条件付きで可（動画メモ）");
        }
      }
    }
    if (input.employment === "self_employed" || input.tags.includes("self_employed")) {
      if (f.acceptsSelfEmployed === true) bonus(15, "自営業の取扱いに強い／可（動画メモ）");
    }
    // --- ハードフィルター: 借地 ---
    const leasehold = input.isLeasehold || input.tags.includes("leasehold");
    if (leasehold) {
      if (f.acceptsLeasehold === false) hardExclude("借地物件は取扱いなし（動画メモ）。");
      else if (f.acceptsLeasehold === true) bonus(25, "借地権の取扱い実績がある（動画メモ）");
    }
    // --- 再建築不可 ---
    const nonRebuild = input.isNonRebuildable || input.tags.includes("non_rebuildable");
    if (nonRebuild) {
      if (f.acceptsNonRebuildable === true) bonus(25, "再建築不可でも対応可（動画メモ）");
      else penalty(15, "再建築不可への対応は動画メモで確認できていません。担保評価で厳しくなる可能性があります。");
    }
    // --- 勤続 ---
    if (f.minTenureMonths != null && input.tenureMonths < f.minTenureMonths) {
      penalty(25, `最低勤続の目安 ${f.minTenureMonths}か月 に対し、入力は ${input.tenureMonths}か月 です。`);
    }
    // --- 面積 ---
    if (f.minAreaSqm != null && input.areaSqm < f.minAreaSqm) {
      penalty(30, `面積の目安 ${f.minAreaSqm}㎡以上 に対し、入力は ${input.areaSqm}㎡ です。自己資金を厚めにすると通る場合がある銀行もあります。`);
    }
    // --- 完済時年齢 ---
    if (f.maxAgeAtCompletion != null && input.age + input.termYears > f.maxAgeAtCompletion) {
      penalty(30, `完済時年齢の上限目安 ${f.maxAgeAtCompletion}歳 に対し、入力では完済時 ${input.age + input.termYears}歳 になります。返済期間の短縮を検討してください。`);
    }
    // --- 返済期間上限 ---
    if (f.maxTermYears != null && input.termYears > f.maxTermYears) {
      hardExclude(`最長返済期間の目安 ${f.maxTermYears}年 を超えています。`);
    }
    // フラット35は最長35年（名称・動画メモの前提）
    if (inst.id === "flat35" && input.termYears > 35) {
      hardExclude("フラット35は最長35年のため、入力の返済期間では対象外です。");
    }

    // --- 返済比率 ---
    const rc = ratioCalc(inst, input);
    if (rc.ratio != null && f.repaymentRatioMax != null) {
      if (rc.ratio > f.repaymentRatioMax) {
        if (inst.id === "sony" || inst.id === "sumishin-sbi") {
          penalty(15, `返済比率の目安 ${rc.ratio.toFixed(1)}% が上限目安 ${f.repaymentRatioMax}% を超えていますが、属性次第で超えた事例もある銀行です（動画メモ）。`);
        } else {
          penalty(35, `返済比率の目安 ${rc.ratio.toFixed(1)}% が上限目安 ${f.repaymentRatioMax}% を超えています。借入額の減額か、実行金利計算のフラット35等を検討してください。`);
        }
      } else {
        bonus(10, `返済比率の目安 ${rc.ratio.toFixed(1)}% は上限目安 ${f.repaymentRatioMax}% の範囲内です。`);
      }
    }

    // --- 単身 ---
    if (input.family === "single") {
      if (inst.id === "sbishinsei") bonus(20, "単身者に強く、単身男性への差別がない（動画メモ）");
      if (inst.id === "mizuho") penalty(10, "単身男性はやや弱いという印象（動画メモ）");
      if (inst.id === "chuo-rokin") penalty(15, "単身者は落とされがち（動画メモ）");
      if (inst.id === "flat35") penalty(10, "単身者は厳しめ（動画メモ）");
    }

    // --- 築年数 ---
    if (input.buildingAgeYears >= 40 || input.tags.includes("old_property")) {
      if (inst.id === "mizuho") bonus(20, "築年数制限がないため築古物件でも出しやすい（動画メモ）");
      if (inst.id === "chuo-rokin") bonus(15, "築年数を問わない（動画メモ）");
      if (inst.id === "shonan-shinkin" && input.propertyType === "condo") {
        // 旧耐震の目安として築45年以上を強めに警告（昭和56年=1981年築以前が不可という動画メモの読み替え）
        if (input.buildingAgeYears >= 45) hardExclude("旧耐震（昭和56年以前）のマンションは不可（動画メモ）。築年数からの推定のため築年月で要確認。");
      }
    }

    // --- フルローン（自己資金が少ない） ---
    const fullLoan = input.tags.includes("full_loan") || input.selfFundRatio < 10;
    if (fullLoan) {
      if (inst.id === "ja") bonus(20, "フルローンが通るとよく言われる（動画メモ）");
      if (inst.id === "sbishinsei") penalty(25, "自己資金1割未満は厳しい（動画メモ）");
      if (inst.id === "sony") cautions.push("頭金1割以上で金利優遇があるため、自己資金が少ないと優遇を受けられません（動画メモ）。");
    }

    // --- タグルール（matching_rules 相当） ---
    for (const tag of input.tags) {
      const rule = inst.tagRules[tag];
      if (rule) {
        if (rule.score >= 0) reasons.push(`${rule.reason}（+${rule.score}）`);
        else cautions.push(`${rule.reason}（${rule.score}）`);
        score += rule.score;
      }
    }
    // タグ固有の汎用フォールバック
    if (input.tags.includes("past_delinquency")) {
      cautions.push("信用情報は審査で最重要視されます（動画#3）。延滞の時期・内容で結果が大きく変わります。");
    }
    if (input.tags.includes("foreign_no_pr") && inst.id !== "sbishinsei") {
      cautions.push("永住権なしの取扱いは動画では社外秘として伏せられた銀行もあり、この銀行の可否は未確認です。");
    }
    if (input.tags.includes("parent_child_relay")) {
      cautions.push("親子リレーは特殊な組み方で、動画メモにこの銀行の具体的取扱いはありません。個別打診が必要です。");
    }

    // 強みは理由の初期値として先頭に（重複を避けて最大3件）
    const mergedReasons = [...reasons];
    for (const s of inst.strengths) {
      if (mergedReasons.length >= 5) break;
      if (!mergedReasons.some((r) => r.includes(s.slice(0, 8)))) mergedReasons.push(s);
    }

    return {
      institution: inst,
      score: Math.max(0, Math.min(100, Math.round(score))),
      excluded: excluded.value,
      excludeReasons,
      reasons: mergedReasons.slice(0, 5),
      cautions: Array.from(new Set(cautions)).slice(0, 6),
      repaymentRatio: rc.ratio,
      repaymentRatioNote: rc.note,
      monthlyPaymentMan: rc.monthly,
    };
  });

  // 除外でないものをスコア順、除外は末尾（理由付きで残す）
  return results.sort((a, b) => {
    if (a.excluded !== b.excluded) return a.excluded ? 1 : -1;
    return b.score - a.score;
  });
}
