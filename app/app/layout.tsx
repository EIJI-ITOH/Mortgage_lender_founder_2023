import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "住宅ローン・マッチング MVP（営業マン向け）",
  description: "訳あり案件を金融機関にマッチングするMVP。データは未確認（動画メモ 2020〜2023由来）です。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
