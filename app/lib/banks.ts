// 金融機関データ
// 出典: 動画7本の整理 summary.md（話者の2020〜2023年頃の実務メモ）
// すべての数値・条件は「未確認（動画メモ 2020〜2023由来）」です。
// 現在の金利・条件を表すものではありません。実務利用前に必ず最新確認が必要です。
// 形は schema.md の institutions / institution_facts / concern_tags / matching_rules に対応させてあり、
// 後でDBへそのまま移せるようにしています。

export const DATA_FRESHNESS_LABEL = "未確認（動画メモ 2020〜2023由来）";
export const DATA_SOURCE_NOTE =
"出典: 不動産営業マン向け動画7本の整理（話者の2020〜2023年頃の実務メモ）。自動字幕由来のため数字に誤認の可能性があります。";

export type YesNo = boolean | "conditional" | null; // null = 動画メモに記載なし（未確認）

export interface ConcernTag {
code: string;
label: string;
category: "applicant" | "property" | "finance" | "health" | "family";
}

export const CONCERN_TAGS: ConcernTag[] = [
{ code: "job_change_recent", label: "転職直後", category: "applicant"},
{ code: "self_employed", label: "自営業", category: "applicant"},
{ code: "pair_loan", label: "収入合算・ペアローン希望", category: "family"},
{ code: "past_delinquency", label: "過去に延滞あり", category: "applicant"},
{ code: "foreign_no_pr", label: "外国籍・永住権なし", category: "applicant"},
{ code: "old_property", label: "物件が古い・担保評価が低そう", category: "property"},
{ code: "leasehold", label: "借地権", category: "property"},
{ code: "non_rebuildable", label: "再建築不可", category: "property"},
{ code: "full_loan", label: "フルローン希望", category: "finance"},
{ code: "danshin_concern", label: "団信が不安（健康）", category: "health"},
{ code: "childcare_leave", label: "産休・育休中", category: "family"},
{ code: "replacement", label: "買い替え", category: "family"},
{ code: "parent_child_relay", label: "親子リレー", category: "family"},
];

export interface InstitutionFacts {
/** 審査金利(%)。null = 動画メモに数値なし */
screeningRate: number | null;
/** 審査金利の扱い: "screening"=審査金利方式 / "execution"=実行金利で計算（数値は未確認） */
screeningRateBasis: "screening" | "execution" | null;
/** 返済比率上限(%)。年収で変わる場合は関数ではなく代表値＋注記で保持 */
repaymentRatioMax: number | null;
repaymentRatioNote: string | null;
minIncomeMan: number | null; // 万円
minTenureMonths: number | null;
maxAgeAtCompletion: number | null;
maxTermYears: number | null;
minAreaSqm: number | null; // マンション等の最低面積
acceptsSelfEmployed: YesNo;
acceptsDispatch: YesNo;
acceptsContract: YesNo;
acceptsLeasehold: YesNo;
acceptsNonRebuildable: YesNo;
acceptsForeignNoPr: YesNo;
wideDanshin: YesNo;
}

export interface Institution {
id: string;
name: string;
type: string;
/** 対応都道府県。null = 地域限定の記載なし（全国扱いとして判定） */
regions: string[] | null;
areaNote: string;
facts: InstitutionFacts;
strengths: string[];
cautions: string[];
requiredDocs: string[];
nextSteps: string[];
/** タグcode → 加減点と理由（schema.md の matching_rules に対応） */
tagRules: Record<string, { score: number; reason: string}>;
}

const baseDocs = ["源泉徴収票／確定申告書", "本人確認書類", "物件資料（登記・間取り等）", "他の借入の明細"];
const sakubunDocs = ["事情説明の作文（滞納しない根拠・経緯）", "役職がある場合は名刺", "満期が近い保険証券", "相続予定物件の評価書"];

function F(p: Partial<InstitutionFacts>): InstitutionFacts {
return {
screeningRate: null,
screeningRateBasis: null,
repaymentRatioMax: null,
repaymentRatioNote: null,
minIncomeMan: null,
minTenureMonths: null,
maxAgeAtCompletion: null,
maxTermYears: null,
minAreaSqm: null,
acceptsSelfEmployed: null,
acceptsDispatch: null,
acceptsContract: null,
acceptsLeasehold: null,
acceptsNonRebuildable: null,
acceptsForeignNoPr: null,
wideDanshin: null,
...p,
};
}

export const INSTITUTIONS: Institution[] = [
{
id: "smbc",
name: "三井住友銀行",
type: "都市銀行",
regions: null,
areaNote: "地域限定の記載なし",
facts: F({
screeningRate: 4.0, screeningRateBasis: "screening", minIncomeMan: 300,
acceptsDispatch: false, acceptsContract: "conditional", acceptsLeasehold: true, wideDanshin: null,
}),
strengths: ["メガバンクの中で最も万能で融通が利くと評価", "借地権（寺の土地等）に対応", "単身赴任でも家族が住む家のローンが可能"],
cautions: ["事前OKでも個人情報・建築会社・金額が大きく変わると本審査で否決され得る", "契約社員は勤続3年以上・月給制・更新1年以上等が条件", "派遣社員は取扱いなし"],
requiredDocs: [...baseDocs, "契約社員の場合は雇用契約書", "会社役員の場合は確定申告書1年分／源泉徴収2年分、預金額の資料"],
nextSteps: ["条件変更が大きい場合は金額・建築会社を固めてから再事前審査", "落ちた場合はみずほ銀行（勤続・面積で緩め）やフラット35を検討"],
tagRules: {
leasehold: { score: 25, reason: "借地権の取扱い実績がある"},
pair_loan: { score: 5, reason: "家族居住前提の組み方が可能"},
},
},
{
id: "mizuho",
name: "みずほ銀行",
type: "都市銀行",
regions: null,
areaNote: "地域限定の記載なし（都心物件に強い）",
facts: F({
screeningRate: 3.5, screeningRateBasis: "screening", minIncomeMan: 300, minTenureMonths: 3,
repaymentRatioMax: 30, repaymentRatioNote: "動画#3の例題（年収420万円・返済比率31.6%で上限超）からの目安",
wideDanshin: true,
}),
strengths: ["都心物件で築年数・面積の制限がないのが大きな強み", "注文住宅は見積りで本審査可、リフォームを1本化できる", "疾病保障等のバリエーションが豊富でワイド団信の公表例あり"],
cautions: ["リフォーム込みだと全体の金利が上がる傾向", "単身男性はやや弱いという印象"],
requiredDocs: [...baseDocs, "注文住宅の場合は見積書（請負契約は建物融資実行1回目まで）"],
nextSteps: ["返済比率で超える場合はフラット35（実行金利計算）を提案", "団信が不安な場合はワイド団信の可否を確認"],
tagRules: {
old_property: { score: 25, reason: "築年数・面積制限がないため古い物件でも出しやすい"},
danshin_concern: { score: 20, reason: "ワイド団信の利用可能行として公表例あり（2023年8月時点の動画情報）"},
job_change_recent: { score: 10, reason: "勤続3か月から対象と緩め"},
},
},
{
id: "suruga",
name: "スルガ銀行",
type: "地方銀行",
regions: null,
areaNote: "地域限定の記載なし",
facts: F({ acceptsSelfEmployed: true, acceptsNonRebuildable: true}),
strengths: ["「困ったらここ」と言われる存在", "自営業に強く、投資物件の賃料収入も見てくれる", "再建築不可も可"],
cautions: ["金利は高め", "事業用の借入も借入として扱われる", "自己資金の通帳が重視される", "結果まで約3週間、本審査一発"],
requiredDocs: [...baseDocs, "自己資金の通帳（残高の裏付け）", "自営業の場合は確定申告書・賃料収入の資料"],
nextSteps: ["金利負担を説明した上で最終手段として提示", "落ちた場合はフラット35や住信SBIのMG保証を検討"],
tagRules: {
self_employed: { score: 30, reason: "自営業に強い"},
non_rebuildable: { score: 25, reason: "再建築不可でも対応可"},
old_property: { score: 15, reason: "担保評価が厳しい物件の受け皿になりやすい"},
past_delinquency: { score: 10, reason: "困った案件の受け皿として名前が挙がる（信用情報の内容次第）"},
},
},
{
id: "chiba-kogyo",
name: "千葉興業銀行",
type: "地方銀行",
regions: ["千葉県"],
areaNote: "千葉県内限定（20歳〜66歳未満、完済80歳以下）",
facts: F({
minIncomeMan: 200, maxAgeAtCompletion: 80, repaymentRatioMax: 35,
repaymentRatioNote: "年収400万円未満35%／以上40%が目安", acceptsLeasehold: false,
}),
strengths: ["千葉県内で年収低めの人に優しい（最低年収200万円）", "返済比率の上限が高めで多めに借りられる"],
cautions: ["千葉県内限定", "家族用住宅・借地は取扱いなし"],
requiredDocs: [...baseDocs],
nextSteps: ["千葉県外の物件では対象外。他行（イオン銀行・JAなど年収条件が緩め）を検討"],
tagRules: {},
},
{
id: "musashino",
name: "武蔵野銀行",
type: "地方銀行",
regions: ["埼玉県"],
areaNote: "埼玉県内が中心",
facts: F({ wideDanshin: true}),
strengths: ["ワイド団信に対応（糖尿病・肝機能障害・高血圧等）", "育休中に強い: 休業中でも「みなし年収」で対応", "埼玉県内の優遇金利条件あり（戸建90㎡以上、マンション65㎡以上、中学生以下の子がいる世帯等）"],
cautions: ["リフォームは物件価格の30%まで。諸費用とリフォームはどちらか一方しか借りられない"],
requiredDocs: [...baseDocs, "育休中の場合は復職前提のみなし年収が分かる資料"],
nextSteps: ["団信で落ちた場合はワイド団信前提で再提示", "埼玉縣信用金庫（産休・育休の返済軽減）も併せて検討"],
tagRules: {
danshin_concern: { score: 30, reason: "ワイド団信の取扱いがある"},
childcare_leave: { score: 30, reason: "育休中のみなし年収対応を打ち出している"},
},
},
{
id: "saitama-shinkin",
name: "埼玉縣信用金庫",
type: "信用金庫",
regions: ["埼玉県"],
areaNote: "埼玉県限定",
facts: F({ minAreaSqm: 50}),
strengths: ["女性向け商品で産休・育休中の返済軽減（2年）、子の進学時の軽減（4年）、最大5年の期間延長", "信金系保証で中古物件にも対応できる場合がある"],
cautions: ["埼玉限定", "面積条件（50㎡超等）があり、満たさない場合は自己資金を多めに出すと通る場合がある"],
requiredDocs: [...baseDocs, "面積条件に届かない場合は自己資金を厚めに用意"],
nextSteps: ["武蔵野銀行（育休みなし年収）と並行で検討", "面積不足は自己資金増額で再挑戦"],
tagRules: {
childcare_leave: { score: 30, reason: "産休・育休中の返済軽減商品がある"},
},
},
{
id: "sony",
name: "ソニー銀行",
type: "ネット銀行",
regions: null,
areaNote: "地域限定の記載なし",
facts: F({
screeningRate: 4.0, screeningRateBasis: "screening", maxAgeAtCompletion: 85, minAreaSqm: 35,
minTenureMonths: 0, acceptsLeasehold: false, wideDanshin: true,
}),
strengths: ["返済比率より属性重視。属性が良ければ比率超えもあり得る", "会社役員は決算書不要、転職初日から審査可", "完済85歳未満と長い。頭金1割以上で金利優遇（変動セレクト）"],
cautions: ["借地は不可、原則本人が住むこと", "マンションは35㎡以上", "ペアローンは扱いが特殊で担当への連絡が前提", "実行まで約2か月と長い", "年収500〜600万円以上で真価を発揮する印象"],
requiredDocs: [...baseDocs, "転職直後の場合は1か月分の給与明細（金銭消費貸借契約時）", "ペアローンの場合は事前に担当へ連絡"],
nextSteps: ["年収が低めの場合はイオン銀行・JAなど条件が緩い先を検討", "団信が不安な場合はワイド団信の可否（団信選択で完済年齢が80歳になる商品もある点に注意）"],
tagRules: {
job_change_recent: { score: 30, reason: "転職初日から審査可能"},
danshin_concern: { score: 15, reason: "ワイド団信の利用可能行として公表例あり（2023年8月時点の動画情報）"},
pair_loan: { score: -10, reason: "ペアローンの扱いが特殊で担当連絡が前提"},
},
},
{
id: "sbishinsei",
name: "SBI新生銀行",
type: "ネット銀行系",
regions: null,
areaNote: "地域限定の記載なし",
facts: F({
screeningRate: 3.0, screeningRateBasis: "screening", repaymentRatioMax: 35,
repaymentRatioNote: "年収400万円以上35%／300万円台20%と厳しめ", acceptsLeasehold: false,
acceptsForeignNoPr: "conditional",
}),
strengths: ["単身者に強く、単身男性への差別がない。女性優遇", "永住権がなくても配偶者が日本国籍なら審査可"],
cautions: ["借地不可", "契約・実行前に2回店舗に行く必要がある", "自己資金1割以上がないと厳しくフルローンは不向き", "担保評価・属性とも厳しめ。その分金利は低い"],
requiredDocs: [...baseDocs, "自己資金1割以上の裏付け", "永住権なしの場合は配偶者の国籍が分かる資料"],
nextSteps: ["フルローン希望ならJAバンク・イオン銀行へ切り替え", "自己資金を用意できてから再挑戦"],
tagRules: {
foreign_no_pr: { score: 25, reason: "永住権なしでも配偶者が日本国籍なら審査可"},
full_loan: { score: -30, reason: "フルローンは厳しい（自己資金1割以上が目安）"},
},
},
{
id: "sumishin-sbi",
name: "住信SBIネット銀行",
type: "ネット銀行",
regions: null,
areaNote: "地域限定の記載なし",
facts: F({
screeningRate: 3.2, screeningRateBasis: "screening", repaymentRatioMax: 35,
repaymentRatioNote: "原則35%以内。属性が良ければ40%超の事例も（年収700万円以上等）",
acceptsDispatch: true, wideDanshin: true,
}),
strengths: ["属性重視で属性が良ければ返済比率40%超の事例もある", "派遣社員でも通るのが珍しい強み", "ワイド団信あり。MG保証（2022年8月〜）で厳しい案件の受け皿が増えた", "紙申込だと作文（事情説明）を付けられる"],
cautions: ["顧客ごとに金利が大きく変わる（最大0.75%上昇の説明）", "手続きが煩雑", "団信の保険会社が申込経路（ネット／紙）で違う"],
requiredDocs: [...baseDocs,...sakubunDocs, "紙申込を推奨（作文を付けて審査に出す）"],
nextSteps: ["通常保証で落ちた場合はMG保証で再審査", "フラット35も並行で検討"],
tagRules: {
past_delinquency: { score: 15, reason: "MG保証という別の受け皿がある"},
danshin_concern: { score: 20, reason: "ワイド団信が使える"},
},
},
{
id: "kiraboshi",
name: "きらぼし銀行",
type: "地方銀行",
regions: null,
areaNote: "地域限定の記載なし（関東版の文脈）",
facts: F({}),
strengths: ["買い替えに強い: 先に買って1年以内の売却約束で可。売却までは利息のみ返済", "注文住宅の土地先行決済も可"],
cautions: ["買い替え以外の特徴は動画では薄め"],
requiredDocs: [...baseDocs, "売却予定物件の資料（1年以内の売却前提）"],
nextSteps: ["買い替えでない案件は他行を優先し、売却スケジュールが固まったら再提示"],
tagRules: {
replacement: { score: 35, reason: "買い替え（先行購入・売却まで利息のみ）に融通が利く"},
},
},
{
id: "chuo-rokin",
name: "中央労働金庫（ろうきん）",
type: "労働金庫",
regions: null,
areaNote: "地域限定の記載なし（組合員が最優遇）",
facts: F({
screeningRateBasis: "execution", minIncomeMan: 150, minTenureMonths: 12,
maxAgeAtCompletion: 76, minAreaSqm: 50,
}),
strengths: ["組合員は最優遇で金利が非常に低い（審査は実行金利で計算）", "他行でクレジット借入が大きかった人でも通る場合がある", "築年数を問わない", "勤務先の労組が中央労金を使っている組合員は特に通りやすい"],
cautions: ["完済76歳未満と短め", "50㎡超が必要", "物件台帳記載事項証明書が必須", "単身者は落とされがち"],
requiredDocs: [...baseDocs, "不動産物件台帳記載事項証明書（必須）", "組合員資格が分かる資料"],
nextSteps: ["組合員でない場合は優遇が弱いため他行と比較", "単身案件はみずほ・SBI新生など単身に強い先も検討"],
tagRules: {
old_property: { score: 20, reason: "築年数を問わない"},
past_delinquency: { score: 15, reason: "クレジット借入が大きかった人でも通った例がある"},
},
},
{
id: "au-jibun",
name: "auじぶん銀行",
type: "ネット銀行",
regions: null,
areaNote: "地域限定の記載なし",
facts: F({}),
strengths: ["金利の安さで常に上位", "決済が楽（司法書士が実行、振込先は3つまで指定可）"],
cautions: ["本審査3〜4週間と長い"],
requiredDocs: [...baseDocs],
nextSteps: ["決済日まで余裕がない案件は、本審査が速い先を優先"],
tagRules: {},
},
{
id: "flat35",
name: "フラット35（クレディセゾン事例）",
type: "フラット35",
regions: null,
areaNote: "公的系の長期固定。取扱機関で細部が異なる",
facts: F({ screeningRateBasis: "execution", acceptsSelfEmployed: true}),
strengths: ["実行金利で返済比率を計算するため、審査金利方式の銀行より比率上多く借りられる場合がある", "自営業でも使える。セゾンの場合、前年との比較をあまり見ないとされ、理由を作文で説明できると通りやすい", "リフォーム一体型（200万円以上）がある", "団信は任意加入"],
cautions: ["勤務先から自宅まで2時間以内（100分以内が目安）でないと厳しい", "単身者は厳しめ", "リフォーム300万円超は完成写真が必要"],
requiredDocs: [...baseDocs, "自営業の場合は理由付けの作文（担当者と作成）", "リフォーム一体型の場合は見積書（200万円以上が条件）"],
nextSteps: ["銀行系で返済比率が超える場合の第一の代替先", "団信が不安な場合は団信任意である点も含めて提示"],
tagRules: {
self_employed: { score: 25, reason: "自営業でも利用でき、作文での理由付けが有効"},
danshin_concern: { score: 20, reason: "団信は任意加入のため健康面で落ちにくい"},
},
},
{
id: "shonan-shinkin",
name: "湘南信用金庫",
type: "信用金庫",
regions: ["神奈川県"],
areaNote: "神奈川（湘南）エリアが中心",
facts: F({
screeningRateBasis: "execution", repaymentRatioMax: 35, minAreaSqm: 50, maxAgeAtCompletion: 80,
repaymentRatioNote: "年収400万円未満30%／以上35%。審査は実行金利",
}),
strengths: ["支店長決裁でプロパー融資ができる場合があり、店舗・担当次第で微妙な案件が通ることがある", "リフォーム条件は特になし"],
cautions: ["変動金利のみ", "マンション・戸建てとも50㎡以上", "旧耐震（昭和56年以前）のマンションは不可"],
requiredDocs: [...baseDocs],
nextSteps: ["支店・担当で結果が変わり得るため、支店長決裁のプロパーを打診", "面積50㎡未満の物件は対象外として他行へ"],
tagRules: {},
},
{
id: "aeon",
name: "イオン銀行",
type: "ネット銀行系（店舗型）",
regions: null,
areaNote: "地域限定の記載なし（イオンモール内店舗で対面手続き）",
facts: F({
screeningRate: 4.0, screeningRateBasis: "screening", repaymentRatioMax: 45,
repaymentRatioNote: "45%未満と緩め", minIncomeMan: 100, minTenureMonths: 6, maxAgeAtCompletion: 80,
acceptsDispatch: "conditional", acceptsContract: "conditional", wideDanshin: true,
}),
strengths: ["返済比率・年収・勤続が最も緩い部類: 最低年収100万円、勤続6か月〜", "契約・派遣も社会保険加入なら可", "マンションの最低面積なし", "勤務先の帝国データバンク評価をあまり見ない印象", "諸費用300万円まで可、自己資金1割で金利優遇"],
cautions: ["手続きはイオンモール内のイオン銀行で対面（事前・本申込とも）。近隣にモールがないと不便"],
requiredDocs: [...baseDocs, "契約・派遣の場合は社会保険加入が分かる資料"],
nextSteps: ["勤続・年収で他行が厳しい場合の受け皿", "対面店舗に行けない場合はネット銀行系へ切り替え"],
tagRules: {
job_change_recent: { score: 20, reason: "勤続6か月から対象と短い"},
danshin_concern: { score: 15, reason: "ワイド団信の利用可能行として公表例あり（2023年8月時点の動画情報）"},
full_loan: { score: 10, reason: "諸費用まで含めやすく条件が緩め"},
},
},
{
id: "ja",
name: "JAバンク",
type: "JA（農協）",
regions: null,
areaNote: "地域のJAごとに条件・保証会社が異なる",
facts: F({
screeningRate: 1.5, screeningRateBasis: "screening", repaymentRatioMax: 35,
repaymentRatioNote: "35%未満", minIncomeMan: 150, minTenureMonths: 12, maxAgeAtCompletion: 80,
maxTermYears: 40, acceptsDispatch: false, acceptsContract: false,
}),
strengths: ["全体に緩めで、フルローンが通るとよく言われる", "最長40年返済ができるのが特徴", "審査金利1.5%と低く返済比率で有利"],
cautions: ["契約・派遣は不可", "保証会社がJAごとに全く違うため地域によって厳しさが変わる。要個別確認"],
requiredDocs: [...baseDocs, "地域のJAの保証会社条件を事前確認"],
nextSteps: ["フルローン希望の受け皿として提示", "地域JAの保証会社が厳しい場合はイオン銀行も検討"],
tagRules: {
full_loan: { score: 25, reason: "フルローンが通るとよく言われる"},
},
},
];

export const PREFECTURES_KANTO = ["東京都", "神奈川県", "千葉県", "埼玉県", "茨城県", "栃木県", "群馬県"];
export const PREFECTURES_OTHER = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"];
