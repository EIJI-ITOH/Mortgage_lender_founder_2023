# 住宅ローン・マッチング MVP（営業マン向け）

不動産営業マン向けに、「訳あり」のある住宅ローン申込者と相性のよい金融機関の候補を
ランキング表示するMVP（最小構成の試作）です。

3画面構成です。

1. **入力**: 年収・年齢・家族構成・雇用形態・勤続年数・借入希望額・返済期間・物件（地域／種別／築年数／面積／借地権／再建築不可）・自己資金割合と、「訳あり」チェック（転職直後、自営業、収入合算・ペアローン、過去に延滞あり、外国籍・永住権なし、物件が古い・担保評価が低そう、借地権、再建築不可、フルローン希望、団信が不安、産休・育休中、買い替え、親子リレー）
2. **結果**: 候補をスコア順に表示（上位3行＋次の候補2行）。各行にスコア、向いている理由、引っかかる点、各行の審査金利で計算した返済比率の目安、鮮度バッジを表示。対象外になった金融機関も理由付きで別枠表示します（黙って消しません）
3. **詳細**: 金融機関の詳細、用意すべき資料リスト、落ちた場合の次の候補・次の手、鮮度表示

## ⚠ データについて（重要）

- 金融機関データは、不動産営業マン向け動画7本の整理（話者の **2020〜2023年頃の実務メモ**）をもとにした
  **未確認のサンプルデータ** です。画面上でも常に「未確認（動画メモ 2020〜2023由来）」と表示しています。
- **現在の金利・審査条件を表すものではありません。** 実際の申込前に必ず最新条件を確認してください。
- 判定はルールベース（決定的スコアリング）です。実際の審査結果を保証しません。
- バックエンド・ログイン・個人情報の保存はありません。入力はブラウザ内でのみ処理されます。

## ローカルで動かす

前提: Node.js 20以上

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開いてください。

本番ビルドの確認は:

```bash
npm run build
npm run start
```

## GitHub に上げて Vercel に公開する手順

アカウントは作成済みの前提です（GitHub / Vercel ともに登録済み）。

### 1. GitHub にリポジトリを作る

1. GitHub で「New repository」から空のリポジトリを作成します（例: `loan-matching-mvp`）。
   README等は追加せず、空のまま作るのが簡単です。

### 2. このプロジェクトを push する

このフォルダで以下を実行します（`YOUR_NAME` と リポジトリ名は自分のものに置き換えてください）。

```bash
git init
git add .
git commit -m "Initial commit: loan matching MVP"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/loan-matching-mvp.git
git push -u origin main
```

（`node_modules` と `.next` は `.gitignore` 済みなので push されません）

### 3. Vercel に import する

1. Vercel のダッシュボードで「Add New… → Project」を選びます。
2. 作成した GitHub リポジトリを選んで「Import」します。
3. Framework は **Next.js** が自動検出されます。設定は既定のままで「Deploy」を押します。
4. デプロイが終わると `https://（プロジェクト名）.vercel.app` のURLが発行されます。
5. 以後は GitHub に push するたびに自動で再デプロイされます。

独自ドメインを使う場合は、Vercel の Project Settings → Domains から追加できます
（ロリポップ側のドメインを使う場合は、Vercelの案内に従ってDNSレコードを設定してください）。

## ファイル構成

```
app/            画面（App Router）: page.tsx が3画面の状態遷移、layout.tsx、globals.css
lib/banks.ts    金融機関データ16機関＋訳ありタグ辞書（出典は summary.md）
lib/matching.ts ルールベースのスコアリング（ハードフィルター→返済比率→タグ加減点）
```

データとルールは、将来DB化する際の設計（institutions / institution_facts / concern_tags / matching_rules）
と同じ形を意識して分離しています。銀行データを直す場合は `lib/banks.ts`、
判定の重みを直す場合は `lib/matching.ts` と各銀行の `tagRules` を編集してください。
ここも編集しましょうね００１
ここも編集しましょうね００２
ここも編集しましょうね００４
ここも編集しましょうね００５