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
  title: "JFLIPSTUDIO | 練馬区の立ち合い型レコーディング・MIXスタジオ",
  description:
    "JFLIPSTUDIOは、録音からMIX・マスタリングまでその場で立ち合い完結する東京・練馬区のレコーディングスタジオです。10hパックなら1時間あたり¥4,000から。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={notoSansJP.variable}>
      <body>{children}</body>
    </html>
  );
}
