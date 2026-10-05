import type { Metadata } from "next";
import { Josefin_Sans, Noto_Sans_JP, Zen_Kaku_Gothic_New } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

// トップページ（2号店サイトと同じデザイン）の和文・欧文
const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-zen",
  display: "swap",
  preload: false,
});
const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-josefin",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jflipstudio.com"),
  title: "JFLIPSTUDIO｜東京・練馬のレコーディングスタジオ｜MIX・マスタリング立ち合い対応",
  description:
    "東京都練馬区豊玉北のレコーディングスタジオ JFLIPSTUDIO。新江古田駅から徒歩8分。録音からMIX・マスタリングまで立ち合いで完結、1時間5,500円から（3時間以上は1時間あたり5,000円）。オンラインMIXは7,000円から、リテイク無制限。",
  robots: { index: true, follow: true },
  verification: { google: "kcBIytu0cweTyBHVrGY1GgFZ49w9GHtyEIu-dU973-8" },
  openGraph: {
    type: "website",
    title: "JFLIPSTUDIO｜東京・練馬のレコーディングスタジオ",
    description: "録音からMIX・マスタリングまで立ち合いで完結。新江古田駅から徒歩8分、1時間5,500円から。",
    images: ["/assets/og-logo.png"],
  },
  twitter: { card: "summary_large_image", images: ["/assets/og-logo.png"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${zenKaku.variable} ${josefin.variable}`}>
      {/* トップページは描画前に body へオープニング用のクラスを付けるため、属性の差分は警告しない */}
      <body suppressHydrationWarning>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
