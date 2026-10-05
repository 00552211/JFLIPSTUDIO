import { createClient } from "@/lib/supabase/server";
import { WorksGrid, type WorkItem } from "./works-grid";
import { HomeEffects } from "./home-effects";
import { PriceSlider } from "./price-slider";
import { AvailabilityCalendar } from "./availability-calendar";
import { ContactForm } from "./contact-form";
import "./home.css";

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
      spotifyTrackId: (w.spotify_track_id as string | null) ?? null,
      spotifyEmbedKind: typeof w.spotify_url === "string" && w.spotify_url.includes("/album/") ? "album" : "track",
      note: (w.note as string | null) ?? null,
      // Spotify は埋め込みプレイヤーで直接聴けるので、リンクバッジからは外す
      links: Array.isArray(w.links)
        ? (w.links as { platform: string; url: string }[])
            .filter((l) => l.platform !== "spotify")
            .map((l) => ({
              label: PLATFORM_LABEL[l.platform] ?? "Link",
              url: l.url,
            }))
        : [],
    }));
  } catch {
    return [];
  }
}

type GalleryItem = { id: string; url: string; alt: string };

const FALLBACK_GALLERY: GalleryItem[] = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => ({
  id: `fallback-${n}`,
  url: `/assets/photo-${String(n).padStart(2, "0")}.jpg`,
  alt: "",
}));

async function getGalleryImages(): Promise<GalleryItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gallery_images")
      .select("id,image_path,alt")
      .eq("is_published", true)
      .order("sort_order", { ascending: true });

    if (error || !data || data.length === 0) return [];

    return data.map((g) => ({
      id: g.id as string,
      alt: (g.alt as string) ?? "",
      url: supabase.storage.from("gallery").getPublicUrl(g.image_path as string).data.publicUrl,
    }));
  } catch {
    return [];
  }
}

const GEAR = [
  { label: "MICROPHONE", name: "Universal Audio Sphere DLX", note: "定番マイクをモデリングできるフラッグシップ・モデリングマイクシステム。", img: "/assets/photo-02.jpg" },
  { label: "AUDIO INTERFACE", name: "MOTU UltraLite mk5", note: "低レイテンシー・高安定のUSBオーディオインターフェース。", img: "/assets/photo-04.jpg" },
  { label: "DAW", name: "PreSonus Studio One", note: "録音からMIX・マスタリングまで同一環境で完結するワークフロー。", img: "/assets/photo-08.jpg" },
  { label: "MONITOR", name: "ADAM Audio T7V", note: "リボンツイーター採用。低域から高域までフラットなモニタリング環境。", img: "/assets/photo-03.jpg" },
  { label: "HEADPHONES", name: "SONY MDR-7506\naudio-technica ATH-M50x", note: "定番の2機種を用途に応じて使い分け。ヘッドホンは複数本ご用意。", img: "/assets/photo-05.jpg" },
  { label: "ENVIRONMENT", name: "防音レコーディングブース", note: "吸音施工済みブース。声のニュアンスをそのまま記録できます。", img: "/assets/hero-bg.jpg" },
];

const MIX_PLANS = [
  { name: "MIX / MASTERING（2mix納品）", price: "¥7,000〜" },
  { name: "パラ・ステムからのMIX", price: "¥12,000〜" },
  { name: "リテイク（修正）", price: "無制限" },
];

const FLOW = [
  { t: "BOOK", d: "予約ページから日時・時間を選択", x: "WEB予約ページから日時と利用時間を選ぶだけ。24時間受け付けています。" },
  { t: "TRACK", d: "Trackを用意", x: "ビートや素材を用意してご来店ください。制作内容は予約時の備考欄でお知らせください。" },
  { t: "STUDIO", d: "スタジオへ来店", x: "詳細な住所は予約確定メールでご案内します。新江古田駅から徒歩8分。" },
  { t: "REC", d: "エンジニア立ち合いで録音", x: "UA Sphere DLX と防音ブースで、声の質感をそのまま収録します。" },
  { t: "MIX / MASTER", d: "その場でMIX・マスタリング", x: "方向性を一緒に相談しながら、その場でMIX・マスタリングまで仕上げます。" },
  { t: "DONE", d: "その日のうちに仕上がりを確認", x: "その日のうちに仕上がりを確認。データでお渡しします。" },
];

const FAQ = [
  { q: "料金にエンジニア代は含まれますか？", a: "はい。表示価格はすべて税込・エンジニア立ち合い込みです。REC・MIX・MASTERまで、追加料金はかかりません。" },
  { q: "何時間から予約できますか？", a: "1時間から、30分単位でご予約いただけます。3時間以上は1時間あたり¥5,000です。延長は15分 ¥1,400です。" },
  { q: "MIX / マスタリングだけの依頼はできますか？", a: "はい。オンラインで対応しています（2mix納品 ¥7,000〜、パラ・ステムからのMIX ¥12,000〜）。リテイクは回数無制限です。トラック数・尺・納期によって変動するため、正確なお見積りはメールまたはInstagramのDMからお問い合わせください。" },
  { q: "支払い方法は？", a: "現金・クレジットカード（タッチ決済対応）がご利用いただけます。" },
  { q: "スタジオの住所は？", a: "東京都練馬区豊玉北です。詳細な住所はご予約確定メールにてご案内します。" },
  { q: "定休日はありますか？", a: "日曜定休です。営業時間は13:00〜23:00。年末年始は別途ご案内します。" },
  { q: "2ヶ月以上先の予約はできますか？", a: "空き状況カレンダーと予約ページは来月分までです。再来月以降はInstagram DMまたはメールでお問い合わせください。" },
];

const BOOKING_URL = "https://book.squareup.com/appointments/atrhlg3x3adiil/location/LJFDVKXY7Y7PC/services";
const INSTAGRAM_URL = "https://www.instagram.com/jfliponthegame/";
const MAIL = "jfliponthegame@gmail.com";
const HERO_SLIDES = ["/assets/hero-bg.jpg", "/assets/photo-06.jpg", "/assets/photo-05.jpg", "/assets/photo-07.jpg", "/assets/photo-08.jpg", "/assets/photo-03.jpg"];
const MARQUEE = ["RECORDING", "MIX", "MASTERING", "ENGINEER INCLUDED", "立ち合いで一貫仕上げ", "NERIMA, TOKYO"];
const NAV = [
  ["#about", "About", "スタジオについて"],
  ["#price", "Price", "料金"],
  ["#flow", "Flow", "ご利用の流れ"],
  ["#works", "Works", "制作実績"],
  ["#equipment", "Equipment", "機材"],
  ["#faq", "FAQ", "よくある質問"],
  ["#access", "Access", "アクセス"],
  ["#contact", "Contact", "お問い合わせ"],
] as const;

/** 初回だけオープニングを流す。描画前に body へクラスを付けて、ちらつきを防ぐ */
const BOOT_SCRIPT = `try{var r=matchMedia('(prefers-reduced-motion: reduce)').matches;document.body.classList.add(!r&&!sessionStorage.getItem('jf-open')?'booting':'no-open')}catch(e){document.body.classList.add('no-open')}`;

const d = (s: string) => ({ "--d": s }) as React.CSSProperties;
const Ext = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M8 7h9v9" /></svg>
);
const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>
);
const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
);

export default async function Home() {
  const [works, galleryFromDb] = await Promise.all([getWorks(), getGalleryImages()]);
  const galleryItems = galleryFromDb.length > 0 ? galleryFromDb : FALLBACK_GALLERY;

  return (
    <div className="jf">
      <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      <HomeEffects />

      {/* OPENING */}
      <div id="opening" aria-hidden="true">
        <div className="words">
          <span style={{ animationDelay: ".1s" }}>Recording</span>
          <span style={{ animationDelay: ".35s" }}>Mix</span>
          <span style={{ animationDelay: ".6s" }}>Mastering</span>
          <span style={{ animationDelay: ".85s", color: "var(--accent)" }}>JFLIPSTUDIO</span>
        </div>
        <div className="count">Loading <b id="cnt">000</b>%</div>
        <div className="bar"><i id="bar" /></div>
      </div>

      <div id="cursor" aria-hidden="true" />

      {/* 固定UI：下の背景が白か黒かで色が反転する */}
      <div className="gh-bg" aria-hidden="true" />
      <header className="gh">
        <a href="#top" className="logo blend" aria-label="JFLIPSTUDIO">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/jflip-logo-white.png" alt="" />
          <span>JFLIPSTUDIO</span>
        </a>
        <div className="right">
          <nav className="gnav blend">
            {NAV.map(([href, en]) => <a key={href} href={href}>{en.toUpperCase()}</a>)}
          </nav>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><span>予約はこちら</span></a>
          <button className="burger blend" id="burger" aria-label="メニュー" aria-expanded="false" aria-controls="mnav">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </header>
      <div className="side blend hide">Recording &amp; Mixing Studio</div>
      <div className="counter blend"><span id="secNo">01</span><i id="pgbar" /><span>10</span></div>

      <div className="mnav" id="mnav">
        {NAV.map(([href, en, ja]) => <a key={href} href={href}>{en}<small>{ja}</small></a>)}
        <a href="#book" className="btn btn-primary">予約する</a>
      </div>

      <div id="page">
        {/* HERO (fixed) */}
        <section className="hero" id="top">
          <div className="slides" id="slides" aria-hidden="true">
            {HERO_SLIDES.map((src, i) =>
              i === 0
                // eslint-disable-next-line @next/next/no-img-element
                ? <img key={src} className="sl on" src={src} alt="" fetchPriority="high" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img key={src} className="sl" data-src={src} alt="" />,
            )}
          </div>
          <a href="#top" className="mark" aria-label="JFLIPSTUDIO">
            <svg viewBox="0 0 200 200" className="orbit" aria-hidden="true">
              <defs><path id="mc" d="M100,100 m-68,0 a68,68 0 1,1 136,0 a68,68 0 1,1 -136,0" /></defs>
              <text><textPath href="#mc" textLength="427" lengthAdjust="spacing">• JFLIPSTUDIO • NERIMA, TOKYO • REC • MIX </textPath></text>
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="core"><img src="/assets/jflip-logo-white.png" alt="" /></span>
          </a>
          <canvas className="grain" id="grain" aria-hidden="true" />
          <div className="dots" id="dots" />
          <div className="bg" id="heroBg" />
          <div className="shade" />
          <a href="/campaign" className="promo"><b>CAMPAIGN</b>お友達紹介で1時間無料 →</a>
          <div className="scroll">Scroll<i /></div>
          <div className="inner">
            <div className="hlead">東京・練馬のレコーディングスタジオ</div>
            <h1 className="big">録音からMIX・マスタリングまで、<em>その場で立ち合い完結。</em></h1>
            <div className="sub en">RECORDING &amp; MIXING STUDIO — NERIMA, TOKYO</div>
          </div>
        </section>
        <div className="hero-space" />

        <div className="after">
          {/* MARQUEE */}
          <section className="light" data-sec="01">
            <div className="marquee" aria-hidden="true">
              <div className="track">
                {[...MARQUEE, ...MARQUEE].map((w, i) => <span key={i}>{w}</span>)}
              </div>
            </div>
          </section>

          {/* ABOUT */}
          <section id="about" className="sec light" data-sec="02">
            <div className="wrap two">
              <div className="head rv" data-px=".06"><h2 className="h2">(About)</h2><p className="h2ja">スタジオについて</p></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <p className="lead rv">アーティストの理想のサウンドを、その場で創り上げる立ち合い型スタジオ。</p>
                <p className="body rv" style={d(".1s")}>JFLIPSTUDIO は、東京・練馬のレコーディングスタジオ。ボーカル録音からMIX・マスタリングまでを一貫して行い、納品までの時間とワークフローを最短化します。方向性を相談しながら、その日のうちに仕上がりを確認できます。</p>
                <div className="points">
                  <div className="card rv" style={d(".05s")}><div className="k">ONE STOP</div><div className="v">立ち合いMIX / マスタリング完結</div><div className="s">録音からその場でMIX・マスタリングまで一貫対応。</div></div>
                  <div className="card rv" style={d(".12s")}><div className="k">GEAR</div><div className="v">UA Sphere DLX &amp; 防音環境</div><div className="s">マイクモデリング対応のフラッグシップ機と、施工済みの防音ブース。</div></div>
                  <div className="card rv" style={d(".19s")}><div className="k">ACCESS</div><div className="v">新江古田 徒歩8分</div><div className="s">江古田駅からも徒歩10分。大江戸線／西武池袋線から。</div></div>
                </div>
                <div className="photos3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rv-img" data-px=".05" src="/assets/photo-02.jpg" alt="UA Sphere DLX" loading="lazy" decoding="async" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rv-img" style={d(".1s")} data-px=".12" src="/assets/photo-06.jpg" alt="スタジオ内観" loading="lazy" decoding="async" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img className="rv-img" style={d(".2s")} data-px=".2" src="/assets/photo-01.jpg" alt="ミキサー" loading="lazy" decoding="async" />
                </div>
              </div>
            </div>
          </section>

          {/* PRICE */}
          <section id="price" className="sec dark" data-sec="03">
            <div className="wrap two">
              <div className="sticky">
                <div className="head rv"><h2 className="h2">(Price)</h2><p className="h2ja">料金</p></div>
                <div className="card pside rv" style={d(".1s")}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>エンジニア（JFLIP）付き</div>
                  <div className="n">REC / MIX / MASTER すべて込み。表示価格はすべて税込です。</div>
                  <div className="n" style={{ borderTop: "1px solid var(--line-d)", paddingTop: 12 }}>延長　15min / ¥1,400</div>
                </div>
                <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary rv" style={{ marginTop: 16, ...d(".2s") }}><span>この料金で予約する</span></a>
              </div>
              <div>
                <PriceSlider />
                <div className="card mixbox rv" style={d(".1s")}>
                  <div className="hd"><span className="t">MIX / MASTERING</span><span className="o">ONLINE ONLY</span></div>
                  <div>
                    {MIX_PLANS.map((p) => <div key={p.name} className="row"><span>{p.name}</span><b>{p.price}</b></div>)}
                  </div>
                  <div className="n">※ MIX / MASTERING はオンライン納品（WAV・MP3）のみの対応です。上記は最低料金で、トラック数・楽曲の尺・納期によって変動します。正確なお見積りは<a className="ul" href={`mailto:${MAIL}`}>メール</a>または<a className="ul" href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer">Instagram DM</a>からお問い合わせください。</div>
                </div>
              </div>
            </div>
          </section>

          {/* INFO / AVAILABILITY */}
          <section id="info" className="sec dark" data-sec="04">
            <div className="wrap">
              <div className="info3">
                <div className="icard rv"><div className="ic-l">OPEN</div><div className="ic-b"><b>13:00 — 23:00</b></div><div className="ic-s">日曜定休・年末年始は別途ご案内</div></div>
                <div className="icard rv" style={d(".1s")}><div className="ic-l">PAYMENT</div><div className="ic-b"><b className="ja">現金 / カード</b></div><div className="ic-s">クレジットカード（タッチ決済対応）</div></div>
                <div className="icard rv" style={d(".2s")}><div className="ic-l">ACCESS</div><div className="ic-b"><b className="ja">新江古田 徒歩8分</b></div><div className="ic-s">西武池袋線 江古田駅からは徒歩10分</div></div>
              </div>
              <div className="av-head rv" style={d(".1s")}>
                <div><h2 className="h2">(Availability)</h2><p className="h2ja">空き状況（2ヶ月先まで）</p></div>
                <div className="av-legend"><span className="lg ok">○ 空きあり</span><span className="lg few">△ 残りわずか</span><span className="lg full">× 満席・定休</span></div>
              </div>
              <div className="rv" style={d(".15s")}>
                <AvailabilityCalendar bookingUrl={BOOKING_URL} />
              </div>
            </div>
          </section>

          {/* BAND 1 */}
          <section className="band" aria-label="">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/photo-07.jpg" alt="" loading="lazy" decoding="async" data-px=".16" />
            <div className="cap">
              <div className="t rv">Record. Mix.<br /><em>Flip.</em></div>
              <div className="s rv" style={d(".1s")}>録音からMIX・マスタリングまで、同じ部屋で。<br />エンジニアと方向性を決めながら、その場で仕上げる。</div>
            </div>
          </section>

          {/* FLOW */}
          <section id="flow" className="sec light" data-sec="05">
            <div className="wrap">
              <div className="top">
                <div className="head rv" data-px=".05"><h2 className="h2">(How it works)</h2><p className="h2ja">ご利用の流れ</p></div>
                <div className="total rv" style={d(".1s")}><b>その日のうちに仕上がりを確認</b><span>1曲を丁寧に仕上げるなら 3h〜 がおすすめ</span></div>
              </div>
              <div className="steps">
                {FLOW.map((s, i) => (
                  <div key={s.t} className={`step rv${i === FLOW.length - 1 ? " last" : ""}`} style={d(`${i * 0.1}s`)}>
                    <div className="n">{String(i + 1).padStart(2, "0")}</div>
                    <div className="t">{s.t}</div>
                    <div className="d">{s.d}</div>
                    <div className="x">{s.x}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* WORKS */}
          <section id="works" className="sec dark" data-sec="06">
            <div className="wrap">
              <div className="top">
                <div className="head rv"><h2 className="h2">(Works)</h2><p className="h2ja">制作実績</p></div>
                <p className="rv" style={d(".1s")}>JFLIPSTUDIO が手がけたレコーディング / MIX / マスタリングの実例です。</p>
              </div>
              <WorksGrid works={works} />
            </div>
          </section>

          {/* EQUIPMENT */}
          <section id="equipment" className="sec light" data-sec="07">
            <div className="wrap two">
              <div className="head rv sticky" data-px=".05"><h2 className="h2">(Equipment)</h2><p className="h2ja">機材</p></div>
              <div className="eq">
                {GEAR.map((g, i) => (
                  <div key={g.label} className="card rv" style={d(`${(i % 2) * 0.1}s`)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <div className="im"><img src={g.img} alt="" loading="lazy" decoding="async" /></div>
                    <div className="label">{g.label}</div>
                    <div className="t" style={{ whiteSpace: "pre-line" }}>{g.name}</div>
                    <div className="s">{g.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* GALLERY */}
          <section id="gallery" className="sec light">
            <div className="wrap">
              <div className="head rv" style={{ marginBottom: 36 }}><h2 className="h2">(Gallery)</h2><p className="h2ja">スタジオ風景</p></div>
              <div className="gal">
                {galleryItems.map((item, i) => (
                  <figure key={item.id} className="rv-img" style={d(`${Math.min(i, 6) * 0.06}s`)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt={item.alt} loading="lazy" decoding="async" />
                    {item.alt && <figcaption>{item.alt}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          </section>

          {/* BAND 2 */}
          <section className="band short" aria-label="">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/photo-08.jpg" alt="" loading="lazy" decoding="async" data-px=".12" />
          </section>

          {/* FAQ */}
          <section id="faq" className="sec dark" data-sec="08">
            <div className="wrap two">
              <div className="sticky head rv"><h2 className="h2">(FAQ)</h2><p className="h2ja">よくある質問</p></div>
              <div className="rv" style={d(".1s")}>
                {FAQ.map((f, i) => (
                  <div key={f.q} className={`acc${i === 0 ? " open" : ""}`}>
                    <button type="button" aria-expanded={i === 0}><span className="q">Q</span><span>{f.q}</span><span className="ic"><Plus /></span></button>
                    <div className="a"><div><p>{f.a}</p></div></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ACCESS */}
          <section id="access" className="sec light" data-sec="09">
            <div className="wrap two">
              <div className="head rv" data-px=".05"><h2 className="h2">(Access)</h2><p className="h2ja">アクセス</p></div>
              <div className="acc-grid">
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div className="rv" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.5 }}>2路線の駅から徒歩圏内</div>
                  <div className="route rv" style={d(".1s")}>
                    <div className="st"><span className="o" /><a className="nm" href="https://www.google.com/maps/search/?api=1&query=%E6%96%B0%E6%B1%9F%E5%8F%A4%E7%94%B0%E9%A7%85" target="_blank" rel="noopener noreferrer"><small>都営大江戸線</small>新江古田駅<Ext /></a></div>
                    <div className="seg"><span className="ln" /><span className="tx"><b>WALK</b>徒歩8分</span></div>
                    <div className="st"><span className="o b" /><span className="nm">JFLIPSTUDIO</span></div>
                  </div>
                  <div className="route rv" style={d(".15s")}>
                    <div className="st"><span className="o" /><a className="nm" href="https://www.google.com/maps/search/?api=1&query=%E6%B1%9F%E5%8F%A4%E7%94%B0%E9%A7%85" target="_blank" rel="noopener noreferrer"><small>西武池袋線</small>江古田駅<Ext /></a></div>
                    <div className="seg"><span className="ln" /><span className="tx"><b>WALK</b>徒歩10分</span></div>
                    <div className="st"><span className="o b" /><span className="nm">JFLIPSTUDIO</span></div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div className="acc-note rv" style={{ ...d(".15s"), borderTop: 0, paddingTop: 0 }}><strong>東京都練馬区豊玉北</strong><br />詳細住所はご予約確定メールにてご案内します。</div>
                  <div className="acc-note rv" style={d(".25s")}><strong>営業時間</strong><br />13:00 — 23:00 / 日曜定休<br />年末年始は別途ご案内します。</div>
                </div>
              </div>
            </div>
          </section>

          {/* CONTACT */}
          <section id="contact" className="sec dark" data-sec="10">
            <div className="wrap two">
              <div className="head rv"><h2 className="h2">(Contact)</h2><p className="h2ja">お問い合わせ</p></div>
              <div>
                <p className="rv" style={{ margin: "0 0 20px", fontSize: 15, lineHeight: 1.9, color: "var(--gray-l)" }}>
                  ご予約は<a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="ul">予約ページ</a>から24時間受け付けています。<br />
                  MIX / マスタリングのお見積り、機材・制作の相談など、その他のお問い合わせはこちらからどうぞ。
                </p>
                <div className="cdirect rv" style={d(".05s")}>
                  <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer"><InstagramIcon />@jfliponthegame</a>
                  <a href={`mailto:${MAIL}`}><MailIcon />{MAIL}</a>
                </div>
                <ContactForm />
              </div>
            </div>
          </section>

          {/* BOOK */}
          <section id="book" className="book dark">
            <div className="deco" data-px=".12" />
            <div className="book-in">
              <div className="ready rv" style={d(".08s")}><span>Ready to</span><em>FLIP?</em></div>
              <div className="s rv" style={d(".16s")}>録音からMIX・マスタリングまで、その場で立ち合い完結。<br />予約ページから日時と時間を選ぶだけ。</div>
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary rv" style={d(".24s")}><span>予約はこちら</span></a>
              <div className="camp rv" style={d(".3s")}>紹介した方・された方 1時間無料 — <a href="/campaign">お友達紹介キャンペーン</a></div>
            </div>
          </section>

          <footer className="ft dark">
            <div className="ft-in">
              <div className="ft-top">
                <div className="ft-brand">
                  <a href="#top" className="logo" aria-label="JFLIPSTUDIO">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/assets/jflip-logo-white.png" alt="" />
                    <span>JFLIPSTUDIO</span>
                  </a>
                  <p>RECORDING &amp; MIXING STUDIO<br />録音からMIX・マスタリングまで立ち合いで完結。<br />東京・練馬区の防音レコーディングスタジオ。</p>
                </div>
                <div className="ft-cols">
                  <div className="ft-col">
                    <div className="label">MENU</div>
                    {NAV.map(([href, en]) => <a key={href} href={href}>{en}</a>)}
                  </div>
                  <div className="ft-col">
                    <div className="label">RESERVATION</div>
                    <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="ja">WEB予約ページ ↗</a>
                    <a href="/campaign" className="ja">紹介キャンペーン</a>
                    <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="ic"><InstagramIcon /><span>Instagram</span></a>
                    <a href={`mailto:${MAIL}`} className="ic"><MailIcon /><span>Mail</span></a>
                  </div>
                  <div className="ft-col">
                    <div className="label">STUDIO</div>
                    <span>東京都練馬区豊玉北</span>
                    <span>都営大江戸線 新江古田駅 徒歩8分</span>
                    <span>西武池袋線 江古田駅 徒歩10分</span>
                    <span style={{ marginTop: 6 }}>13:00 — 23:00 / 日曜定休</span>
                    <span style={{ color: "var(--gray)", marginTop: 6 }}>詳細住所はご予約確定後にお送りします</span>
                  </div>
                </div>
              </div>
              <div className="ft-bottom">
                <div>© 2026 JFLIPSTUDIO</div>
                <div>RECORDING &amp; MIXING STUDIO — NERIMA, TOKYO</div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      <a href="#top" className="up" id="up" aria-label="ページの先頭へ">
        <svg viewBox="0 0 100 100" className="orbit" aria-hidden="true"><defs><path id="circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs><text><textPath href="#circ">SCROLL UP • SCROLL UP • SCROLL UP • </textPath></text></svg>
        <svg className="arr" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
      </a>

      <div className="mcta" id="mcta">
        <a href="#price" className="btn btn-ghost" style={{ flex: "0 0 auto", color: "#fff", padding: "0 20px", fontSize: 14 }}>料金</a>
        <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: "1 1 auto", fontSize: 15, boxShadow: "0 10px 24px rgba(var(--accent-rgb), .3)" }}>
          予約する
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      </div>
    </div>
  );
}
