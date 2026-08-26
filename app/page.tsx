import { createClient } from "@/lib/supabase/server";
import { PricingToggle } from "./pricing-toggle";
import { AvailabilityCalendar } from "./availability-calendar";

type WorkLink = { label: string; url: string };
type WorkItem = {
  id: string;
  title: string;
  artist: string;
  year: string;
  roles: string[];
  credits: string;
  jacketUrl: string | null;
  links: WorkLink[];
};

const PLATFORM_LABEL: Record<string, string> = {
  spotify: "Spotify",
  apple_music: "Apple Music",
  youtube: "YouTube",
  x: "X",
  other: "Link",
};

async function getWorks(): Promise<WorkItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("published_works")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error || !data) return [];

    return data.map((w) => ({
      id: w.id as string,
      title: w.title as string,
      artist: w.artist as string,
      year: w.release_date ? String(new Date(w.release_date as string).getFullYear()) : "",
      roles: (w.roles ?? []) as string[],
      credits: Array.isArray(w.credits)
        ? (w.credits as { role: string; name: string }[])
            .map((c) => `${c.role} / ${c.name}`)
            .join("　")
        : "",
      jacketUrl: w.jacket_path
        ? supabase.storage.from("works").getPublicUrl(w.jacket_path as string).data.publicUrl
        : null,
      links: Array.isArray(w.links)
        ? (w.links as { platform: string; url: string }[]).map((l) => ({
            label: PLATFORM_LABEL[l.platform] ?? "Link",
            url: l.url,
          }))
        : [],
    }));
  } catch {
    return [];
  }
}

const GEAR = [
  { label: "MICROPHONE", name: "Universal Audio Sphere DLX", note: "定番マイクをモデリングできるフラッグシップ・モデリングマイクシステム。" },
  { label: "AUDIO INTERFACE", name: "MOTU UltraLite mk5", note: "低レイテンシー・高安定のUSBオーディオインターフェース。" },
  { label: "DAW SOFTWARE", name: "PreSonus Studio One", note: "録音からMIX・マスタリングまで同一環境で完結するワークフロー。" },
  { label: "MONITOR SPEAKERS", name: "ADAM Audio T7V", note: "リボンツイーター採用。低域から高域までフラットなモニタリング環境。" },
  { label: "HEADPHONES", name: "SONY MDR-7506 / audio-technica ATH-M50x", note: "定番の2機種を用途に応じて使い分け。ヘッドホンは複数本ご用意。" },
  { label: "ENVIRONMENT", name: "防音レコーディングブース", note: "吸音施工済みブース。声のニュアンスをそのまま記録できます。" },
];

const BOOKING_URL = "https://book.squareup.com/appointments/atrhlg3x3adiil/location/LJFDVKXY7Y7PC/services";
const INSTAGRAM_URL = "https://www.instagram.com/jfliponthegame/";

export default async function Home() {
  const works = await getWorks();

  return (
    <div style={{ background: "#0a0a0a", minHeight: "100vh" }}>
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
        <div className="hdr-in" style={{ maxWidth: 1180, margin: "0 auto", padding: "14px 32px", display: "flex", alignItems: "center", gap: 24, flexWrap: "nowrap" }}>
          <a href="#top" style={{ display: "flex", alignItems: "center", gap: 10, flex: "none", whiteSpace: "nowrap" }}>
            <img src="/assets/jflip-logo-white.png" alt="JFLIPSTUDIO" style={{ width: 26, height: 26, objectFit: "contain" }} />
            <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".16em" }}>JFLIPSTUDIO</span>
          </a>
          <nav className="hdr-nav" style={{ display: "flex", gap: 20, fontSize: 11, letterSpacing: ".14em", color: "rgba(255,255,255,.55)", flex: "none" }}>
            <a href="#pricing" className="hover-link" style={{ color: "inherit", flex: "none", whiteSpace: "nowrap" }}>HOURS &amp; PRICE</a>
            <a href="#availability" className="hover-link" style={{ color: "inherit", flex: "none", whiteSpace: "nowrap" }}>CALENDAR</a>
            <a href="#gallery" className="hover-link" style={{ color: "inherit", flex: "none", whiteSpace: "nowrap" }}>GALLERY</a>
            <a href="#about" className="hover-link" style={{ color: "inherit", flex: "none", whiteSpace: "nowrap" }}>ABOUT</a>
            <a href="#works" className="hover-link" style={{ color: "inherit", flex: "none", whiteSpace: "nowrap" }}>WORKS</a>
            <a href="#gear" className="hover-link" style={{ color: "inherit", flex: "none", whiteSpace: "nowrap" }}>EQUIPMENT</a>
            <a href="#contact" className="hover-link" style={{ color: "inherit", flex: "none", whiteSpace: "nowrap" }}>CONTACT</a>
          </nav>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, flex: "none" }}>
            <span className="hdr-hours" style={{ fontSize: 11, letterSpacing: ".1em", color: "rgba(255,255,255,.45)", whiteSpace: "nowrap" }}>
              13:00–23:00 / 日曜定休
            </span>
            <a
              href={BOOKING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover-lift"
              style={{ background: "#fff", color: "#0a0a0a", fontSize: 11.5, fontWeight: 700, letterSpacing: ".08em", padding: "9px 18px", borderRadius: 999, whiteSpace: "nowrap", flex: "none" }}
            >
              WEB予約
            </a>
          </div>
        </div>
        <div className="hdr-mobnav" style={{ display: "none", gap: 18, overflowX: "auto", padding: "0 20px 11px", fontSize: 11, letterSpacing: ".12em", color: "rgba(255,255,255,.55)", scrollbarWidth: "none" }}>
          {[["#pricing", "HOURS & PRICE"], ["#availability", "CALENDAR"], ["#gallery", "GALLERY"], ["#about", "ABOUT"], ["#works", "WORKS"], ["#gear", "EQUIPMENT"], ["#contact", "CONTACT"]].map(([href, label]) => (
            <a key={href} href={href} style={{ color: "inherit", whiteSpace: "nowrap", flex: "none" }}>{label}</a>
          ))}
        </div>
      </header>

      <section id="top" className="wrap-hero" style={{ maxWidth: 1180, margin: "0 auto", padding: "96px 32px 88px" }}>
        <p style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 26px" }}>
          RECORDING &amp; MIXING STUDIO / NERIMA TOKYO
        </p>
        <div className="hero-grid" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 56, alignItems: "start" }}>
          <div>
            <h1 className="h-hero" style={{ fontSize: 52, lineHeight: 1.24, fontWeight: 700, letterSpacing: "-.01em", margin: "0 0 26px" }}>
              録音からMIX・マスタリングまで、
              <br />
              その場で立ち合い完結。
            </h1>
            <p style={{ fontSize: 14.5, lineHeight: 2, color: "rgba(255,255,255,.6)", maxWidth: "44em", margin: "0 0 34px" }}>
              JFLIPSTUDIO は、アーティストの理想のサウンドをその場で創り上げる立ち合い型スタジオ。ボーカル録音からMIX・マスタリングまでを一貫して行い、納品までの時間とワークフローを最短化します。10hパックなら1時間あたり¥4,000から。
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hover-lift" style={{ background: "#fff", color: "#0a0a0a", fontSize: 13, fontWeight: 700, padding: "14px 26px", borderRadius: 999 }}>
                WEBで予約する
              </a>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover-outline" style={{ border: "1px solid rgba(255,255,255,.22)", fontSize: 13, padding: "14px 26px", borderRadius: 999, color: "rgba(255,255,255,.82)" }}>
                @jfliponthegame
              </a>
            </div>
            <div className="hero-stats" style={{ display: "flex", gap: 44, marginTop: 56, paddingTop: 30, borderTop: "1px solid rgba(255,255,255,.1)" }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>1時間 ¥4,000〜</div>
                <div style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(255,255,255,.42)", marginTop: 7 }}>10hパック利用時 / エンジニア込み</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>13:00–23:00</div>
                <div style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(255,255,255,.42)", marginTop: 7 }}>営業時間（日曜定休）</div>
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.01em" }}>新江古田 徒歩8分</div>
                <div style={{ fontSize: 11, letterSpacing: ".14em", color: "rgba(255,255,255,.42)", marginTop: 7 }}>江古田駅からは徒歩10分</div>
              </div>
            </div>
          </div>
          <div className="hero-card" style={{ background: "#111", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, padding: "34px 30px", display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
            <span style={{ fontSize: 9.5, letterSpacing: ".26em", color: "rgba(255,255,255,.4)", border: "1px solid rgba(255,255,255,.14)", borderRadius: 999, padding: "6px 14px" }}>
              RECORDING &amp; SOUND DESIGN
            </span>
            <span className="glitch" style={{ width: 150, height: 150 }}>
              <img src="/assets/jflip-logo-white.png" alt="JFLIPSTUDIO" style={{ width: 150, height: 150, objectFit: "contain" }} />
            </span>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>完全立ち合いでの一貫仕上げ</div>
              <p style={{ fontSize: 12, lineHeight: 1.95, color: "rgba(255,255,255,.5)", margin: 0 }}>
                レコーディングからMIX・マスタリングまで、その場で一緒に方向性を決めながら仕上げます。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" style={{ borderTop: "1px solid rgba(255,255,255,.08)", background: "#0d0d0d" }}>
        <div className="wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 32px" }}>
          <p style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 18px" }}>HOURS &amp; PRICE</p>
          <h2 className="h-sec" style={{ fontSize: 32, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-.01em" }}>営業時間 &amp; 料金案内</h2>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.55)", margin: "0 0 38px" }}>
            シンプルでわかりやすいパック料金制。WEB予約ページより即時予約が可能です。
          </p>

          <div className="hours-box" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#141414", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, padding: "26px 30px", marginBottom: 26 }}>
            <div>
              <div style={{ fontSize: 10.5, letterSpacing: ".26em", color: "rgba(255,255,255,.4)", marginBottom: 10 }}>BUSINESS HOURS</div>
              <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-.01em" }}>13:00 – 23:00</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>日曜定休</div>
              <div style={{ fontSize: 11, letterSpacing: ".1em", color: "rgba(255,255,255,.42)", marginTop: 7 }}>年末年始は別途ご案内</div>
            </div>
          </div>

          <PricingToggle />
        </div>
      </section>

      <AvailabilityCalendar />

      <section id="gallery" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div className="wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 32px" }}>
          <p style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 18px" }}>STUDIO ATMOSPHERE</p>
          <h2 className="h-sec" style={{ fontSize: 32, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-.01em" }}>スタジオ風景 &amp; GALLERY</h2>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.55)", margin: "0 0 34px" }}>
            実際のスタジオの様子です。
          </p>
          <div className="gal" style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 14 }}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={n}
                src={`/assets/photo-${String(n).padStart(2, "0")}.jpg`}
                alt=""
                loading="lazy"
                style={{
                  gridColumn: n <= 2 ? "span 6" : "span 4",
                  aspectRatio: n <= 2 ? "3/2" : "4/3",
                  width: "100%",
                  borderRadius: 12,
                  objectFit: "cover",
                  filter: "saturate(.92)",
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="about" style={{ borderTop: "1px solid rgba(255,255,255,.08)", background: "#0d0d0d" }}>
        <div className="wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 32px" }}>
          <div style={{ textAlign: "center", marginBottom: 44 }}>
            <p style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 18px" }}>WHY JFLIPSTUDIO</p>
            <h2 className="h-sec" style={{ fontSize: 32, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-.01em" }}>スタジオの3つの強み</h2>
            <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.55)", margin: 0 }}>理想の音像をスピーディーかつ確実に出せる環境を整えています。</p>
          </div>
          <div className="g3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, padding: "30px 26px" }}>
              <div style={{ width: 44, height: 44, border: "1px solid rgba(255,255,255,.16)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, background: "rgba(255,255,255,.04)" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round">
                  <path d="M3 12h2" />
                  <path d="M7 8.5v7" />
                  <path d="M11 4.5v15" />
                  <path d="M15 7v10" />
                  <path d="M19 10v4" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>立ち合いMIX / マスタリング完結</h3>
              <p style={{ fontSize: 12.5, lineHeight: 2, color: "rgba(255,255,255,.52)", margin: 0 }}>
                録音からその場で MIX・マスタリングまで一貫対応。方向性を相談しながら、その日のうちに仕上がりを確認できます。
              </p>
            </div>
            <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, padding: "30px 26px" }}>
              <div style={{ width: 44, height: 44, border: "1px solid rgba(255,255,255,.16)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, background: "rgba(255,255,255,.04)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round">
                  <rect x="9" y="2.5" width="6" height="11" rx="3" />
                  <path d="M5.5 11a6.5 6.5 0 0 0 13 0" />
                  <path d="M12 17.5V21.5" />
                  <path d="M8.5 21.5h7" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>UA Sphere DLX &amp; 防音環境</h3>
              <p style={{ fontSize: 12.5, lineHeight: 2, color: "rgba(255,255,255,.52)", margin: 0 }}>
                マイクモデリング対応のフラッグシップ機と、施工済みの防音ブース。声の質感をそのまま収録できます。
              </p>
            </div>
            <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, padding: "30px 26px" }}>
              <div style={{ width: 44, height: 44, border: "1px solid rgba(255,255,255,.16)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, background: "rgba(255,255,255,.04)" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 21.5s7-6.1 7-11.1A7 7 0 0 0 5 10.4c0 5 7 11.1 7 11.1Z" />
                  <circle cx="12" cy="10" r="2.6" />
                </svg>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 12px" }}>複数路線から好アクセス</h3>
              <p style={{ fontSize: 12.5, lineHeight: 2, color: "rgba(255,255,255,.52)", margin: 0 }}>
                新江古田駅から徒歩8分、江古田駅から徒歩10分。大江戸線／西武池袋線からアクセスしやすい練馬区のスタジオです。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="works" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div className="wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 32px" }}>
          <div className="works-hd" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 18px" }}>DISCOGRAPHY &amp; PORTFOLIO</p>
              <h2 className="h-sec" style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-.01em" }}>制作実績 &amp; WORKS</h2>
            </div>
          </div>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.55)", margin: "0 0 34px" }}>
            JFLIPSTUDIOが手がけたレコーディング / MIX / マスタリングの実例です。
          </p>

          <div className="g2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
            {works.map((w) => (
              <div key={w.id} style={{ background: "#111", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {w.roles.map((r) => (
                      <span key={r} style={{ fontSize: 9.5, letterSpacing: ".16em", color: "rgba(255,255,255,.62)", border: "1px solid rgba(255,255,255,.18)", borderRadius: 999, padding: "4px 10px" }}>
                        {r}
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: 10.5, letterSpacing: ".14em", color: "rgba(255,255,255,.34)" }}>{w.year}</span>
                </div>
                <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                  {w.jacketUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={w.jacketUrl} alt="" style={{ width: 96, height: 96, flex: "none", borderRadius: 8, objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: 96, height: 96, flex: "none", borderRadius: 8, background: "#1a1a1a", border: "1px dashed rgba(255,255,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, letterSpacing: ".12em", color: "rgba(255,255,255,.3)" }}>
                      JACKET
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{w.title}</div>
                    <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)", marginBottom: 12 }}>{w.artist}</div>
                    <div style={{ fontSize: 11.5, lineHeight: 1.85, color: "rgba(255,255,255,.4)", marginBottom: 14 }}>{w.credits}</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {w.links.map((l) => (
                        <a
                          key={l.url}
                          href={l.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover-outline-sm"
                          style={{ fontSize: 11, letterSpacing: ".06em", color: "rgba(255,255,255,.72)", border: "1px solid rgba(255,255,255,.16)", borderRadius: 999, padding: "6px 13px" }}
                        >
                          {l.label} ↗
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ gridColumn: works.length === 0 ? "1 / -1" : undefined, border: "1px dashed rgba(255,255,255,.14)", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 180 }}>
              <div style={{ fontSize: 13, letterSpacing: ".16em", color: "rgba(255,255,255,.45)" }}>MORE WORKS COMING SOON</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.3)", textAlign: "center", maxWidth: "36em" }}>現在準備中です。公開できる制作実績が揃いしだい、こちらに掲載していきます。</div>
            </div>
          </div>
        </div>
      </section>

      <section id="gear" style={{ borderTop: "1px solid rgba(255,255,255,.08)", background: "#0d0d0d" }}>
        <div className="wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 32px" }}>
          <p style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 18px" }}>STUDIO GEAR &amp; ENVIRONMENT</p>
          <h2 className="h-sec" style={{ fontSize: 32, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-.01em" }}>機材・スタジオスペック</h2>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.55)", margin: "0 0 34px" }}>選び抜いた機材構成で、高解像なリスニング環境と安定した動作を実現します。</p>
          <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, overflow: "hidden" }}>
            {GEAR.map((g) => (
              <div key={g.label} className="gear-row" style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 28, padding: "22px 28px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
                <span style={{ fontSize: 10.5, letterSpacing: ".2em", color: "rgba(255,255,255,.42)", paddingTop: 3 }}>{g.label}</span>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 500, marginBottom: 7 }}>{g.name}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.85, color: "rgba(255,255,255,.45)" }}>{g.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
        <div className="wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 32px" }}>
          <p style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 18px" }}>INQUIRY &amp; ACCESS</p>
          <h2 className="h-sec" style={{ fontSize: 32, fontWeight: 700, margin: "0 0 14px", letterSpacing: "-.01em" }}>アクセス &amp; お問い合わせ</h2>
          <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.55)", margin: "0 0 40px" }}>住所・最寄駅・お支払い方法からマルチアクセスが可能な立地です。</p>
          <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".2em", color: "rgba(255,255,255,.4)", marginBottom: 12 }}>所在地・最寄り駅</div>
                <div style={{ fontSize: 14.5, fontWeight: 500, marginBottom: 14 }}>東京都練馬区豊玉北</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.45)", marginBottom: 14 }}>以降の詳細住所はご予約確定メールにてご案内します。</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: "rgba(255,255,255,.65)" }}>
                    都営大江戸線「新江古田」駅 徒歩8分
                  </div>
                  <div style={{ border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: "12px 16px", fontSize: 12.5, color: "rgba(255,255,255,.65)" }}>
                    西武池袋線「江古田」駅 徒歩10分
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".2em", color: "rgba(255,255,255,.4)", marginBottom: 10 }}>スタジオのご予約</div>
                <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)", marginBottom: 14 }}>WEB予約ページから24時間受付</div>
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hover-lift" style={{ display: "inline-block", background: "#fff", color: "#0a0a0a", fontSize: 12.5, fontWeight: 700, padding: "12px 24px", borderRadius: 999 }}>
                  WEB予約ページを開く ↗
                </a>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".2em", color: "rgba(255,255,255,.4)", marginBottom: 10 }}>お支払い方法</div>
                <div style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)" }}>現金 / クレジットカード（タッチ決済対応）</div>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".2em", color: "rgba(255,255,255,.4)", marginBottom: 10 }}>メールアドレス</div>
                <a href="mailto:jfliponthegame@gmail.com" className="hover-link" style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)" }}>
                  jfliponthegame@gmail.com ↗
                </a>
              </div>
              <div>
                <div style={{ fontSize: 11, letterSpacing: ".2em", color: "rgba(255,255,255,.4)", marginBottom: 10 }}>Instagram DM</div>
                <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover-link" style={{ fontSize: 13.5, color: "rgba(255,255,255,.7)" }}>
                  @jfliponthegame ↗
                </a>
              </div>
            </div>
            <div style={{ background: "#111", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, padding: 28 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: ".16em", color: "rgba(255,255,255,.45)", marginBottom: 8 }}>お問い合わせ種別</div>
                  <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "rgba(255,255,255,.55)", display: "flex", justifyContent: "space-between" }}>
                    スタジオのご予約について<span style={{ color: "rgba(255,255,255,.35)" }}>▾</span>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: ".16em", color: "rgba(255,255,255,.45)", marginBottom: 8 }}>お名前 / アーティスト名</div>
                    <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "rgba(255,255,255,.35)" }}>アーティスト名</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, letterSpacing: ".16em", color: "rgba(255,255,255,.45)", marginBottom: 8 }}>メールアドレス</div>
                    <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, padding: "12px 14px", fontSize: 13, color: "rgba(255,255,255,.35)" }}>example@mail.com</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: ".16em", color: "rgba(255,255,255,.45)", marginBottom: 8 }}>お問い合わせ内容</div>
                  <div style={{ border: "1px solid rgba(255,255,255,.14)", borderRadius: 8, padding: "12px 14px", fontSize: 13, lineHeight: 1.9, color: "rgba(255,255,255,.35)", minHeight: 104 }}>
                    ご希望の日時、制作内容（レコーディング / MIX / マスタリング）をご記入ください。
                  </div>
                </div>
                <a
                  href="mailto:jfliponthegame@gmail.com"
                  className="hover-lift"
                  style={{ background: "#fff", color: "#0a0a0a", borderRadius: 999, padding: 14, textAlign: "center", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                >
                  送信する
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,.08)", background: "#0d0d0d" }}>
        <div className="ft-grid" style={{ maxWidth: 1180, margin: "0 auto", padding: "64px 32px 34px", display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr", gap: 40 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <img src="/assets/jflip-logo-white.png" alt="JFLIPSTUDIO" style={{ width: 24, height: 24, objectFit: "contain" }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".16em" }}>JFLIPSTUDIO</span>
            </div>
            <p style={{ fontSize: 12, lineHeight: 2, color: "rgba(255,255,255,.42)", margin: 0 }}>
              録音からMIX・マスタリングまで立ち合いで完結。東京・練馬区の防音レコーディングスタジオ。
            </p>
          </div>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: ".2em", color: "rgba(255,255,255,.4)", marginBottom: 16 }}>NAVIGATION</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 12.5, color: "rgba(255,255,255,.6)" }}>
              <a href="#top" style={{ color: "inherit" }}>HOME</a>
              <a href="#pricing" style={{ color: "inherit" }}>PRICE &amp; HOURS</a>
              <a href="#gallery" style={{ color: "inherit" }}>GALLERY</a>
              <a href="#works" style={{ color: "inherit" }}>WORKS</a>
              <a href="#gear" style={{ color: "inherit" }}>EQUIPMENT</a>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: ".2em", color: "rgba(255,255,255,.4)", marginBottom: 16 }}>RESERVATION</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 12.5, color: "rgba(255,255,255,.6)" }}>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="hover-link" style={{ color: "inherit" }}>
                WEB予約ページ ↗
              </a>
              <span>営業時間 13:00–23:00</span>
              <span>2h / 3h / 5h / 6h / 10h パック</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: ".2em", color: "rgba(255,255,255,.4)", marginBottom: 16 }}>SOCIAL &amp; ACCESS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 11, fontSize: 12.5, color: "rgba(255,255,255,.6)" }}>
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover-link" style={{ color: "inherit" }}>
                Instagram @jfliponthegame ↗
              </a>
              <span>新江古田 徒歩8分 / 江古田 徒歩10分</span>
              <span>東京都練馬区</span>
            </div>
          </div>
        </div>
        <div className="ft-btm" style={{ maxWidth: 1180, margin: "0 auto", padding: "0 32px 40px", display: "flex", justifyContent: "space-between", fontSize: 11, color: "rgba(255,255,255,.3)" }}>
          <span>© 2026 JFLIPSTUDIO. All rights reserved.</span>
          <span>13:00–23:00 / 日曜定休</span>
        </div>
      </footer>
    </div>
  );
}
