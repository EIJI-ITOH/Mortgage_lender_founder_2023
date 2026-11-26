"use client";

import { useMemo, useState } from "react";
import {
  CONCERN_TAGS,
  DATA_FRESHNESS_LABEL,
  DATA_SOURCE_NOTE,
  PREFECTURES_KANTO,
  PREFECTURES_OTHER,
} from "@/lib/banks";
import {
  matchInstitutions,
  type EmploymentType,
  type FamilyType,
  type MatchInput,
  type MatchResult,
  type PropertyType,
} from "@/lib/matching";

type Screen = "input" | "results" | "detail";

const TENURE_OPTIONS = [
  { label: "3か月未満", months: 1 },
  { label: "3か月〜1年未満", months: 6 },
  { label: "1〜3年", months: 24 },
  { label: "3年以上", months: 48 },
];

function FreshnessBanner() {
  return (
    <div className="freshness" role="note">
      ⚠ このアプリの金融機関データはすべて「{DATA_FRESHNESS_LABEL}」です。現在の金利・条件ではありません。
      実際の申込前に、必ず各金融機関の最新条件と現場の経験者による確認を行ってください。
    </div>
  );
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("input");
  const [selected, setSelected] = useState<MatchResult | null>(null);

  // 画面1の入力（初期値は動画#3の例題: 年収420万円・借入2,500万円・35年）
  const [incomeMan, setIncomeMan] = useState(420);
  const [age, setAge] = useState(38);
  const [family, setFamily] = useState<FamilyType>("couple");
  const [employment, setEmployment] = useState<EmploymentType>("regular");
  const [tenureMonths, setTenureMonths] = useState(48);
  const [loanAmountMan, setLoanAmountMan] = useState(2500);
  const [termYears, setTermYears] = useState(35);
  const [prefecture, setPrefecture] = useState("東京都");
  const [propertyType, setPropertyType] = useState<PropertyType>("condo");
  const [buildingAgeYears, setBuildingAgeYears] = useState(25);
  const [areaSqm, setAreaSqm] = useState(65);
  const [isLeasehold, setIsLeasehold] = useState(false);
  const [isNonRebuildable, setIsNonRebuildable] = useState(false);
  const [selfFundRatio, setSelfFundRatio] = useState(10);
  const [tags, setTags] = useState<string[]>([]);
  const [memo, setMemo] = useState("");

  const input: MatchInput = useMemo(
    () => ({
      incomeMan, age, family, employment, tenureMonths, loanAmountMan, termYears,
      prefecture, propertyType, buildingAgeYears, areaSqm,
      isLeasehold, isNonRebuildable, selfFundRatio, tags,
    }),
    [incomeMan, age, family, employment, tenureMonths, loanAmountMan, termYears, prefecture, propertyType, buildingAgeYears, areaSqm, isLeasehold, isNonRebuildable, selfFundRatio, tags]
  );

  const results = useMemo(() => (screen === "input" ? [] : matchInstitutions(input)), [screen, input]);
  const candidates = results.filter((r) => !r.excluded);
  const excluded = results.filter((r) => r.excluded);
  const top = candidates.slice(0, 3);
  const nextCandidates = candidates.slice(3, 5);

  const toggleTag = (code: string) =>
    setTags((prev) => (prev.includes(code) ? prev.filter((t) => t !== code) : [...prev, code]));

  const openDetail = (r: MatchResult) => {
    setSelected(r);
    setScreen("detail");
    window.scrollTo({ top: 0 });
  };

  // ---------- 画面3: 詳細 ----------
  if (screen === "detail" && selected) {
    const inst = selected.institution;
    const others = candidates.filter((r) => r.institution.id !== inst.id).slice(0, 3);
    return (
      <main>
        <h1>{inst.name}</h1>
        <p className="subtitle">{inst.type} ／ {inst.areaNote}</p>
        <span className="badge">{DATA_FRESHNESS_LABEL}</span>
        <FreshnessBanner />

        <div className="card">
          <div className="result-head">
            <span className="bankname">マッチ度</span>
            <span className="score">{selected.excluded ? "対象外" : `${selected.score}点`}</span>
          </div>
          {selected.excluded && (
            <>
              <div className="section-label">対象外の理由</div>
              <ul className="tight caution">
                {selected.excludeReasons.map((r) => (<li key={r}>{r}</li>))}
              </ul>
            </>
          )}
          <div className="section-label">向いている理由</div>
          <ul className="tight">
            {selected.reasons.map((r) => (<li key={r}>{r}</li>))}
          </ul>
          <div className="section-label">引っかかる点</div>
          <ul className="tight caution">
            {selected.cautions.map((c) => (<li key={c}>{c}</li>))}
          </ul>
          <div className="section-label">返済比率の目安</div>
          <p style={{ margin: "4px 0", fontSize: "0.93rem" }}>
            {selected.repaymentRatio != null
              ? <>約 {selected.repaymentRatio.toFixed(1)}%（月返済の目安 約 {selected.monthlyPaymentMan?.toFixed(1)}万円）<br /></>
              : null}
            <span className="small">{selected.repaymentRatioNote}</span>
          </p>
          <div className="section-label">鮮度</div>
          <p className="small" style={{ margin: "4px 0" }}>
            最終確認日: 未確認 ／ {DATA_SOURCE_NOTE}
          </p>
        </div>

        <h2>用意すべき資料</h2>
        <div className="card">
          <ul className="tight">
            {inst.requiredDocs.map((d) => (<li key={d}>{d}</li>))}
          </ul>
          <p className="small">
            動画#3の事例では、満期が近い保険証券や相続予定の実家の評価書など「求められていない資料」を添えたことで
            グレーゾーンの案件がメガバンクで承認されています。ヒアリングで滞納しない根拠を掘り起こすことが前提です。
          </p>
        </div>

        <h2>落ちた場合の次の手</h2>
        <div className="card">
          <ul className="tight">
            {inst.nextSteps.map((s) => (<li key={s}>{s}</li>))}
          </ul>
          {others.length > 0 && (
            <>
              <div className="section-label">次の候補（この入力での順位順）</div>
              <ul className="tight">
                {others.map((r) => (
                  <li key={r.institution.id}>
                    <a href="#" onClick={(e) => { e.preventDefault(); openDetail(r); }}>
                      {r.institution.name}（{r.score}点）
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="small">
            共通の受け皿: 住信SBIネット銀行のMG保証、フラット35（実行金利計算）、団信が理由ならワイド団信対応行も検討してください（いずれも動画メモ由来・未確認）。
          </p>
        </div>

        <button className="ghost" onClick={() => setScreen("results")}>← 結果に戻る</button>{" "}
        <button className="ghost" onClick={() => setScreen("input")}>入力を変える</button>
        <footer>{DATA_SOURCE_NOTE} 本アプリは入力を保存しません（ブラウザ内でのみ判定します）。</footer>
      </main>
    );
  }

  // ---------- 画面2: 結果 ----------
  if (screen === "results") {
    const renderCard = (r: MatchResult, rank: number) => (
      <div key={r.institution.id} className="card tap" onClick={() => openDetail(r)} role="button" aria-label={`${r.institution.name}の詳細`}>
        <div className="result-head">
          <span className="rank">{rank}位</span>
          <span className="bankname">{r.institution.name}</span>
          <span className="banktype">{r.institution.type}</span>
          <span className="score">{r.score}点</span>
        </div>
        <div style={{ margin: "6px 0" }}><span className="badge">{DATA_FRESHNESS_LABEL}</span></div>
        <div className="section-label">向いている理由</div>
        <ul className="tight">
          {r.reasons.slice(0, 2).map((x) => (<li key={x}>{x}</li>))}
        </ul>
        <div className="section-label">引っかかる点</div>
        <ul className="tight caution">
          {r.cautions.slice(0, 2).map((x) => (<li key={x}>{x}</li>))}
          {r.cautions.length === 0 && <li>特記事項なし（動画メモの範囲）</li>}
        </ul>
        <div className="section-label">返済比率の目安</div>
        <p className="small" style={{ margin: "4px 0" }}>
          {r.repaymentRatio != null
            ? `約 ${r.repaymentRatio.toFixed(1)}%（月返済 約 ${r.monthlyPaymentMan?.toFixed(1)}万円）`
            : "計算方式の都合で表示なし（詳細参照）"}
          {" — "}{r.repaymentRatioNote}
        </p>
        <p className="small">タップで詳細・必要資料・次の手 →</p>
      </div>
    );

    return (
      <main>
        <h1>候補の金融機関</h1>
        <p className="subtitle">
          年収{incomeMan}万円 ／ 借入希望{loanAmountMan}万円 ／ {termYears}年 ／ {prefecture}・
          {propertyType === "condo" ? "マンション" : "戸建"}（築{buildingAgeYears}年・{areaSqm}㎡）
          {tags.length > 0 ? ` ／ 訳あり: ${CONCERN_TAGS.filter((t) => tags.includes(t.code)).map((t) => t.label).join("、")}` : ""}
        </p>
        <FreshnessBanner />

        <h2>おすすめ上位</h2>
        {top.length === 0 && <p>この入力では、対象外でない候補がありませんでした。下の「対象外」の理由を確認してください。</p>}
        {top.map((r, i) => renderCard(r, i + 1))}

        {nextCandidates.length > 0 && (
          <>
            <h2>次の候補</h2>
            {nextCandidates.map((r, i) => renderCard(r, i + 4))}
          </>
        )}

        {excluded.length > 0 && (
          <>
            <h2>対象外・条件に合わない金融機関</h2>
            <p className="small">黙って消さず、理由を明示しています。タップで詳細が見られます。</p>
            {excluded.map((r) => (
              <div key={r.institution.id} className="card excluded tap" onClick={() => openDetail(r)} role="button">
                <div className="result-head">
                  <span className="bankname">{r.institution.name}</span>
                  <span className="banktype">{r.institution.type}</span>
                  <span className="score" style={{ color: "var(--bad)" }}>対象外</span>
                </div>
                <ul className="tight caution">
                  {r.excludeReasons.map((x) => (<li key={x}>{x}</li>))}
                </ul>
              </div>
            ))}
          </>
        )}

        <button className="ghost" onClick={() => setScreen("input")}>← 入力に戻る</button>
        <footer>{DATA_SOURCE_NOTE} 本アプリは入力を保存しません。</footer>
      </main>
    );
  }

  // ---------- 画面1: 入力 ----------
  return (
    <main>
      <h1>住宅ローン・マッチング MVP</h1>
      <p className="subtitle">不動産営業マン向け ／ 訳あり案件の出し先候補を、動画メモのルールでランキングします</p>
      <FreshnessBanner />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setScreen("results");
          window.scrollTo({ top: 0 });
        }}
      >
        <fieldset>
          <legend>お客さんの基本情報</legend>
          <div className="grid">
            <label className="field">年収（万円）
              <input type="number" min={0} max={10000} value={incomeMan} onChange={(e) => setIncomeMan(Number(e.target.value))} required />
            </label>
            <label className="field">年齢（歳）
              <input type="number" min={18} max={90} value={age} onChange={(e) => setAge(Number(e.target.value))} required />
            </label>
            <label className="field">家族構成
              <select value={family} onChange={(e) => setFamily(e.target.value as FamilyType)}>
                <option value="single">単身</option>
                <option value="couple">夫婦</option>
                <option value="with_children">子あり世帯</option>
              </select>
            </label>
            <label className="field">雇用形態
              <select value={employment} onChange={(e) => setEmployment(e.target.value as EmploymentType)}>
                <option value="regular">正社員</option>
                <option value="contract">契約社員</option>
                <option value="dispatch">派遣社員</option>
                <option value="self_employed">自営業・フリーランス</option>
                <option value="executive">会社役員</option>
              </select>
            </label>
            <label className="field">勤続年数
              <select value={tenureMonths} onChange={(e) => setTenureMonths(Number(e.target.value))}>
                {TENURE_OPTIONS.map((o) => (<option key={o.label} value={o.months}>{o.label}</option>))}
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>借入と物件</legend>
          <div className="grid">
            <label className="field">借入希望額（万円）
              <input type="number" min={0} max={30000} value={loanAmountMan} onChange={(e) => setLoanAmountMan(Number(e.target.value))} required />
            </label>
            <label className="field">返済期間（年）
              <input type="number" min={1} max={50} value={termYears} onChange={(e) => setTermYears(Number(e.target.value))} required />
            </label>
            <label className="field">物件の地域（都道府県）
              <select value={prefecture} onChange={(e) => setPrefecture(e.target.value)}>
                <optgroup label="関東">
                  {PREFECTURES_KANTO.map((p) => (<option key={p} value={p}>{p}</option>))}
                </optgroup>
                <optgroup label="関東以外">
                  {PREFECTURES_OTHER.map((p) => (<option key={p} value={p}>{p}</option>))}
                </optgroup>
              </select>
            </label>
            <label className="field">物件種別
              <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as PropertyType)}>
                <option value="condo">マンション</option>
                <option value="house">戸建</option>
              </select>
            </label>
            <label className="field">築年数（年）
              <input type="number" min={0} max={100} value={buildingAgeYears} onChange={(e) => setBuildingAgeYears(Number(e.target.value))} required />
            </label>
            <label className="field">面積（㎡）
              <input type="number" min={0} max={500} value={areaSqm} onChange={(e) => setAreaSqm(Number(e.target.value))} required />
            </label>
            <label className="field">自己資金の割合（％）<span>物件価格に対する自己資金。0%＝フルローン</span>
              <input type="number" min={0} max={100} value={selfFundRatio} onChange={(e) => setSelfFundRatio(Number(e.target.value))} required />
            </label>
          </div>
          <div className="checks" style={{ marginTop: 12 }}>
            <label className="check">
              <input type="checkbox" checked={isLeasehold} onChange={(e) => setIsLeasehold(e.target.checked)} />
              借地権の物件
            </label>
            <label className="check">
              <input type="checkbox" checked={isNonRebuildable} onChange={(e) => setIsNonRebuildable(e.target.checked)} />
              再建築不可の物件
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>「訳あり」チェック（複数選択）</legend>
          <div className="checks">
            {CONCERN_TAGS.map((t) => (
              <label key={t.code} className="check">
                <input type="checkbox" checked={tags.includes(t.code)} onChange={() => toggleTag(t.code)} />
                {t.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="field" style={{ marginTop: 8 }}>メモ（任意・保存されません）
          <textarea rows={2} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="例: 役職あり、満期保険200万円、実家を相続予定 など" />
        </label>

        <button type="submit" className="primary">候補を見る</button>
      </form>

      <footer>
        {DATA_SOURCE_NOTE} 本アプリはログイン不要・入力保存なしのMVPです。判定は動画メモをもとにしたルールベースで、実際の審査結果を保証しません。
      </footer>
    </main>
  );
}
