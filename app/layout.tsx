import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://jflipstudio.com"),
  title: "JFLIPSTUDIO｜東京・練馬のレコーディングスタジオ｜MIX・マスタリング立ち合い対応",
  description:
    "東京都練馬区豊玉北のレコーディングスタジオ JFLIPSTUDIO。新江古田駅から徒歩8分。録音からMIX・マスタリングまで立ち合いで完結、1時間あたり4,000円から。オンラインMIXは7,000円から、リテイク無制限。",
  robots: { index: true, follow: true },
  verification: { google: "kcBIytu0cweTyBHVrGY1GgFZ49w9GHtyEIu-dU973-8" },
  icons: { icon: "/assets/jflip-logo-white.png", apple: "/assets/jflip-logo-white.png" },
  openGraph: {
    type: "website",
    title: "JFLIPSTUDIO｜東京・練馬のレコーディングスタジオ",
    description: "録音からMIX・マスタリングまで立ち合いで完結。新江古田駅から徒歩8分、1時間あたり4,000円から。",
    images: ["/assets/photo-01.jpg"],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body>
        {/* ローディング画面：CSSのみで1.5秒後にフェードアウト（JSブロックなし） */}
        <div id="boot">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="mark" src="/assets/jflip-logo-white.png" alt="" />
          <div className="bar"><i /></div>
          <div className="label">JFLIPSTUDIO</div>
        </div>
        {children}
      </body>
    </html>
  );
}
