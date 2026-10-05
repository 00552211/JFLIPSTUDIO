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

// CONNECT Studio のページ（トップ・池袋店・練馬店）の和文・欧文
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
  title: "CONNECT Studio｜池袋・練馬のレコーディングスタジオ",
  description:
    "池袋・練馬のレコーディングスタジオ CONNECT Studio。エンジニア付きで、RECからMIX / MASTERまでその場で完結。池袋店は池袋駅から2駅・徒歩6分、練馬店は新江古田駅から徒歩8分。",
  robots: { index: true, follow: true },
  verification: { google: "kcBIytu0cweTyBHVrGY1GgFZ49w9GHtyEIu-dU973-8" },
  openGraph: {
    type: "website",
    siteName: "CONNECT Studio",
    title: "CONNECT Studio｜池袋・練馬のレコーディングスタジオ",
    description: "エンジニア付き。RECからMIX / MASTERまで、その場で完結。池袋店・練馬店。",
    images: ["/connect/og.jpg"],
  },
  twitter: { card: "summary_large_image", images: ["/connect/og.jpg"] },
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
