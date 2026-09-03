import type { Metadata } from "next";
import { ScrollReveal } from "../scroll-reveal";

const BOOKING_URL = "https://book.squareup.com/appointments/atrhlg3x3adiil/location/LJFDVKXY7Y7PC/services";
const INSTAGRAM_URL = "https://www.instagram.com/jfliponthegame/";
const CAMPAIGN_END = "2026年10月31日";

export const metadata: Metadata = {
  title: "お友達紹介キャンペーン｜JFLIPSTUDIO",
  description:
    "JFLIPSTUDIOのお友達紹介キャンペーン。紹介した方・された方どちらも1時間（5,500円）無料。2026年10月31日まで実施中。",
  openGraph: {
    type: "website",
    title: "お友達紹介キャンペーン｜JFLIPSTUDIO",
    description: "紹介した方もされた方も、1時間（5,500円）無料。2026年10月31日まで。",
    images: ["/assets/og-logo.png"],
  },
  twitter: { card: "summary_large_image", images: ["/assets/og-logo.png"] },
};

const STEPS = [
  {
    n: "01",
    title: "紹介する人が名前を伝える",
    body: "JFLIPSTUDIOをすでに利用したことがある方が、お友達に自分の名前（予約に使った名前）を伝えます。",
  },
  {
    n: "02",
    title: "予約時、備考欄に紹介者名を記入",
    body: "紹介された方（利用が初めての方）がWEB予約する際、Squareの予約フォームの備考欄に紹介してくれた方の名前を書いてください。",
  },
  {
    n: "03",
    title: "当日の会計時にその場で割引",
    body: "ご来店当日、会計時にスタッフが備考欄を確認し、紹介した方・された方それぞれの利用料金から5,500円を割引します。",
  },
];

const CONDITIONS = [
  "特典の対象は「紹介した方」「紹介された方」の双方です（1時間＝5,500円分をそれぞれ無料）。",
  "紹介された方は、JFLIPSTUDIOのご利用が初めての方に限ります。",
  "特典を使う回のご利用は、合計2時間以上のご予約が条件です（2時間パック以上の中から1時間分が無料になります）。",
  "予約時にSquare備考欄への紹介者名の記入がない場合、特典は適用できません。",
  `キャンペーン期間：2026年8月28日〜${CAMPAIGN_END}のご来店分まで。`,
];

export default function CampaignPage() {
  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh", color: "#fff" }}>
      <ScrollReveal />

      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(10,10,10,.86)",
          backdropFilter: "blur(14px)",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", gap: 24 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", color: "inherit" }}>
            <img src="/assets/jflip-logo-white.png" alt="JFLIPSTUDIO" style={{ width: 26, height: 26, objectFit: "contain" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".16em" }}>JFLIPSTUDIO</span>
          </a>
          <a href="/" className="hover-link" style={{ marginLeft: "auto", fontSize: 11, letterSpacing: ".12em", color: "rgba(255,255,255,.55)" }}>
            ← TOPへ戻る
          </a>
        </div>
      </header>

      <section style={{ position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 20% 0%, rgba(255,255,255,.06), transparent 55%)",
          }}
        />
        <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "96px 32px 80px", textAlign: "center" }}>
          <p data-reveal style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 22px" }}>
            REFERRAL CAMPAIGN
          </p>
          <h1 data-reveal className="h-hero" style={{ fontSize: 44, lineHeight: 1.32, fontWeight: 700, letterSpacing: "-.01em", margin: "0 0 24px", transitionDelay: ".08s" }}>
            お友達を紹介して、
            <br />
            お互いに1時間無料。
          </h1>
          <p data-reveal style={{ fontSize: 14.5, lineHeight: 2, color: "rgba(255,255,255,.6)", maxWidth: "36em", margin: "0 auto 36px", transitionDelay: ".16s" }}>
            JFLIPSTUDIOをすでにご利用いただいた方が、初めてのお友達をご紹介すると、紹介した方・された方どちらも1時間分（5,500円）が無料になります。
          </p>
          <div data-reveal style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6, padding: "18px 36px", border: "1px solid rgba(255,255,255,.16)", borderRadius: 14, marginBottom: 36, transitionDelay: ".2s" }}>
            <span style={{ fontSize: 30, fontWeight: 700 }}>¥5,500 OFF</span>
            <span style={{ fontSize: 11.5, letterSpacing: ".08em", color: "rgba(255,255,255,.45)" }}>× お二人分 / 最低2時間利用が条件</span>
          </div>
          <div data-reveal style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", transitionDelay: ".26s" }}>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hover-lift" style={{ background: "#fff", color: "#0a0a0a", fontSize: 13, fontWeight: 700, padding: "14px 28px", borderRadius: 999 }}>
              WEBで予約する
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover-outline" style={{ border: "1px solid rgba(255,255,255,.22)", fontSize: 13, padding: "14px 28px", borderRadius: 999, color: "rgba(255,255,255,.82)" }}>
              @jfliponthegame
            </a>
          </div>
          <p data-reveal style={{ fontSize: 11.5, color: "rgba(255,255,255,.4)", marginTop: 20, transitionDelay: ".3s" }}>
            キャンペーン期間：〜{CAMPAIGN_END}
          </p>
        </div>
      </section>

      <section style={{ borderBottom: "1px solid rgba(255,255,255,.08)", background: "#0d0d0d" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 32px" }}>
          <p data-reveal style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 14px" }}>HOW IT WORKS</p>
          <h2 data-reveal className="h-sec" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 44px", letterSpacing: "-.01em", transitionDelay: ".06s" }}>
            使い方は3ステップ
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} data-reveal style={{ display: "flex", gap: 24, alignItems: "flex-start", transitionDelay: `${0.06 + i * 0.06}s` }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.3)", letterSpacing: ".06em", flex: "none", width: 32 }}>{s.n}</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                  <p style={{ fontSize: 13, lineHeight: 1.95, color: "rgba(255,255,255,.55)", margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ borderBottom: "1px solid rgba(255,255,255,.08)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 32px" }}>
          <p data-reveal style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 14px" }}>CONDITIONS</p>
          <h2 data-reveal className="h-sec" style={{ fontSize: 28, fontWeight: 700, margin: "0 0 32px", letterSpacing: "-.01em", transitionDelay: ".06s" }}>
            ご利用条件
          </h2>
          <ul data-reveal style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 16, transitionDelay: ".12s" }}>
            {CONDITIONS.map((c) => (
              <li key={c} style={{ display: "flex", gap: 12, fontSize: 13.5, lineHeight: 1.9, color: "rgba(255,255,255,.65)" }}>
                <span style={{ color: "rgba(255,255,255,.35)", flex: "none" }}>―</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 32px 100px", textAlign: "center" }}>
          <h2 data-reveal className="h-sec" style={{ fontSize: 26, fontWeight: 700, margin: "0 0 16px", letterSpacing: "-.01em" }}>
            お友達を誘って、一緒に良い曲を作ろう。
          </h2>
          <p data-reveal style={{ fontSize: 13.5, color: "rgba(255,255,255,.55)", margin: "0 0 32px", transitionDelay: ".08s" }}>
            ご不明な点があればお気軽にDMまたはメールでお問い合わせください。
          </p>
          <div data-reveal style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", transitionDelay: ".14s" }}>
            <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hover-lift" style={{ background: "#fff", color: "#0a0a0a", fontSize: 13, fontWeight: 700, padding: "14px 28px", borderRadius: 999 }}>
              WEBで予約する
            </a>
            <a href="mailto:jfliponthegame@gmail.com" className="hover-outline" style={{ border: "1px solid rgba(255,255,255,.22)", fontSize: 13, padding: "14px 28px", borderRadius: 999, color: "rgba(255,255,255,.82)" }}>
              メールで問い合わせる
            </a>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,.08)", background: "#0d0d0d" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "34px 32px", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12, fontSize: 11, color: "rgba(255,255,255,.3)" }}>
          <span>© 2026 JFLIPSTUDIO. All rights reserved.</span>
          <span>13:00–23:00 / 日曜定休</span>
        </div>
      </footer>
    </div>
  );
}
