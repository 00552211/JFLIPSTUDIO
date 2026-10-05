import { createClient } from "@/lib/supabase/server";
import { STUDIOS, type RouteStop, type Studio } from "@/lib/studios";
import { WorksGrid, type WorkItem } from "@/app/works-grid";
import { HomeEffects } from "@/app/home-effects";
import { PriceSlider } from "@/app/price-slider";
import { AvailabilityCalendar } from "@/app/availability-calendar";
import { ContactForm } from "@/app/contact-form";
import { BOOT_SCRIPT, Opening, Cursor, Ext, InstagramIcon, MailIcon, YouTubeIcon, TikTokIcon, Plus, ScrollUp, d } from "./studio-parts";
import "@/app/home.css";

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

function Route({ stops }: { stops: RouteStop[] }) {
  return (
    <>
      {stops.map((s, i) =>
        s.kind === "seg" ? (
          <div key={i} className="seg"><span className={`ln${s.walk ? " walk" : ""}`} /><span className="tx"><b>{s.b}</b>{s.t}</span></div>
        ) : (
          <div key={i} className="st">
            <span className={`o${s.goal ? " b" : ""}`} />
            {s.maps
              ? <a className="nm" href={s.maps} target="_blank" rel="noopener noreferrer">{s.line && <small>{s.line}</small>}{s.name}<Ext /></a>
              : <span className="nm">{s.line && <small>{s.line}</small>}{s.name}</span>}
          </div>
        ),
      )}
    </>
  );
}

const Lines = ({ text }: { text: string }) => <>{text.split("\n").map((l, i) => <span key={i}>{i > 0 && <br />}{l}</span>)}</>;

/** 店舗ページ（池袋店・練馬店）。中身は lib/studios.ts の店舗データ */
export async function StudioPage({ studio: s }: { studio: Studio }) {
  const [works, galleryFromDb] = await Promise.all([
    s.hasWorks ? getWorks() : Promise.resolve([]),
    s.hasGallery ? getGalleryImages() : Promise.resolve([]),
  ]);
  const galleryItems = galleryFromDb.length > 0 ? galleryFromDb : FALLBACK_GALLERY;
  const other = s.slug === "ikebukuro" ? STUDIOS.nerima : STUDIOS.ikebukuro;
  const studioName = `CONNECT Studio ${s.nameJa}`;

  const nav: [string, string, string][] = [
    ["#about", "About", "スタジオについて"],
    ["#price", "Price", "料金"],
    ["#flow", "Flow", "ご利用の流れ"],
    ...(s.engineer ? [["#engineer", "Engineer", "エンジニア"] as [string, string, string]] : []),
    ...(s.hasWorks ? [["#works", "Works", "制作実績"] as [string, string, string]] : []),
    ["#equipment", "Equipment", "機材"],
    ["#faq", "FAQ", "よくある質問"],
    ["#access", "Access", "アクセス"],
    ["#contact", "Contact", "お問い合わせ"],
  ];
  // セクション番号（右下のカウンター）は data-sec を付けた順に振る
  let sec = 0;
  const next = () => String(++sec).padStart(2, "0");
  const secs = {
    marquee: next(), about: next(), price: next(), info: next(), flow: next(),
    mid: s.engineer || s.hasWorks ? next() : "", equipment: next(), faq: next(), access: next(), contact: next(),
  };

  return (
    <div className="jf">
      <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      <HomeEffects />
      <Opening />
      <Cursor />

      {/* 固定UI：下の背景が白か黒かで色が反転する */}
      <div className="gh-bg" aria-hidden="true" />
      <header className="gh">
        <a href="/" className="logo blend" aria-label="CONNECT Studio トップへ">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/connect/logo-white.svg" alt="CONNECT" className="lg" />
        </a>
        <div className="right">
          <nav className="store-sw blend" aria-label="店舗">
            <a href="/ikebukuro" aria-current={s.slug === "ikebukuro" ? "page" : undefined}>池袋</a>
            <a href="/nerima" aria-current={s.slug === "nerima" ? "page" : undefined}>練馬</a>
          </nav>
          <nav className="gnav blend">
            {nav.map(([href, en]) => <a key={href} href={href}>{en.toUpperCase()}</a>)}
          </nav>
          <a href={s.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><span>予約はこちら</span></a>
          <button className="burger blend" id="burger" aria-label="メニュー" aria-expanded="false" aria-controls="mnav">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
        </div>
      </header>
      <div className="side blend hide">Connect from here — {s.areaEn}</div>
      <div className="counter blend"><span id="secNo">01</span><i id="pgbar" /><span>{String(sec).padStart(2, "0")}</span></div>

      <div className="mnav" id="mnav">
        <div className="mstore">
          <a href="/ikebukuro" aria-current={s.slug === "ikebukuro" ? "page" : undefined}>池袋店</a>
          <a href="/nerima" aria-current={s.slug === "nerima" ? "page" : undefined}>練馬店</a>
        </div>
        {nav.map(([href, en, ja]) => <a key={href} href={href}>{en}<small>{ja}</small></a>)}
        <a href="#book" className="btn btn-primary">予約する</a>
      </div>

      <div id="page">
        {/* HERO (fixed) */}
        <section className="hero" id="top">
          <div className="slides" id="slides" aria-hidden="true">
            {s.hero.slides.map((src, i) =>
              i === 0
                // eslint-disable-next-line @next/next/no-img-element
                ? <img key={src} className="sl on" src={src} alt="" fetchPriority="high" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img key={src} className="sl" data-src={src} alt="" />,
            )}
          </div>
          <a href="#top" className="mark" aria-label={studioName}>
            <svg viewBox="0 0 200 200" className="orbit" aria-hidden="true">
              <defs><path id="mc" d="M100,100 m-68,0 a68,68 0 1,1 136,0 a68,68 0 1,1 -136,0" /></defs>
              <text><textPath href="#mc" textLength="427" lengthAdjust="spacing">{`• CONNECT STUDIO • ${s.areaEn}, TOKYO • REC • MIX `}</textPath></text>
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="core"><img src="/connect/mark-lime.svg" alt="" /></span>
          </a>
          <canvas className="grain" id="grain" aria-hidden="true" />
          <div className="dots" id="dots" />
          <div className="bg" id="heroBg" />
          <div className="shade" />
          {s.campaign && <a href={s.campaign.href} className="promo"><b>CAMPAIGN</b>{s.campaign.label}</a>}
          <div className="scroll">Scroll<i /></div>
          <div className="inner">
            <div className="hlead">{s.hero.lead}</div>
            <h1 className="big">{s.hero.big}<em>{s.hero.em}</em></h1>
            <div className="sub en">CONNECT FROM HERE — {s.areaEn}, TOKYO</div>
          </div>
        </section>
        <div className="hero-space" />

        <div className="after">
          {/* MARQUEE */}
          <section className="light" data-sec={secs.marquee}>
            <div className="marquee" aria-hidden="true">
              <div className="track">
                {[...s.marquee, ...s.marquee].map((w, i) => <span key={i}>{w}</span>)}
              </div>
            </div>
          </section>

          {/* ABOUT */}
          <section id="about" className="sec light" data-sec={secs.about}>
            <div className="wrap two">
              <div className="head rv" data-px=".06"><h2 className="h2">(About)</h2><p className="h2ja">{s.nameJa}について</p></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                <p className="lead rv">{s.about.lead}</p>
                <p className="body rv" style={d(".1s")}>{s.about.body}</p>
                {s.about.points && (
                  <div className="points">
                    {s.about.points.map((p, i) => (
                      <div key={p.k} className="card rv" style={d(`${0.05 + i * 0.07}s`)}><div className="k">{p.k}</div><div className="v">{p.v}</div><div className="s">{p.s}</div></div>
                    ))}
                  </div>
                )}
                <div className="photos3">
                  {s.about.photos.map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={p.src} className="rv-img" style={d(`${i * 0.1}s`)} data-px={[".05", ".12", ".2"][i]} src={p.src} alt={p.alt} loading="lazy" decoding="async" />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* PRICE */}
          <section id="price" className="sec dark" data-sec={secs.price}>
            <div className="wrap two">
              <div className="sticky">
                <div className="head rv"><h2 className="h2">(Price)</h2><p className="h2ja">料金</p></div>
                <div className="card pside rv" style={d(".1s")}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{s.price.sideTitle}</div>
                  <div className="n">{s.price.sideNote}</div>
                  <div className="n" style={{ borderTop: "1px solid var(--line-d)", paddingTop: 12 }}>延長　{s.price.extension}</div>
                </div>
                <a href={s.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary rv" style={{ marginTop: 16, ...d(".2s") }}><span>この料金で予約する</span></a>
              </div>
              <div>
                <PriceSlider price={s.price} />
                {s.price.mix && (
                  <div className="card mixbox rv" style={d(".1s")}>
                    <div className="hd"><span className="t">MIX / MASTERING</span><span className="o">ONLINE ONLY</span></div>
                    <div>
                      {s.price.mix.plans.map((p) => <div key={p.name} className="row"><span>{p.name}</span><b>{p.price}</b></div>)}
                    </div>
                    <div className="n">{s.price.mix.note}</div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* INFO / AVAILABILITY */}
          <section id="info" className="sec dark" data-sec={secs.info}>
            <div className="wrap">
              <div className="info3">
                {s.info.map((c, i) => (
                  <div key={c.l} className="icard rv" style={d(`${i * 0.1}s`)}><div className="ic-l">{c.l}</div><div className="ic-b"><b className={c.ja ? "ja" : undefined}>{c.b}</b></div><div className="ic-s">{c.s}</div></div>
                ))}
              </div>
              <div className="av-head rv" style={d(".1s")}>
                <div><h2 className="h2">(Availability)</h2><p className="h2ja">空き状況（2ヶ月先まで）</p></div>
                <div className="av-legend"><span className="lg ok">○ 空きあり</span><span className="lg few">△ 残りわずか</span><span className="lg full">× {s.availability.closedWeekday === null ? "空きなし" : "満席・定休"}</span></div>
              </div>
              <div className="rv" style={d(".15s")}>
                <AvailabilityCalendar store={s.slug} bookingUrl={s.bookingUrl} closedWeekday={s.availability.closedWeekday} instagram={s.social.instagram} email={s.email} />
              </div>
            </div>
          </section>

          {/* BAND 1 */}
          <section className="band" aria-label="">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.band.img} alt="" loading="lazy" decoding="async" data-px=".16" />
            <div className="cap">
              <div className="t rv">{s.band.t1}<br /><em>{s.band.em}</em></div>
              <div className="s rv" style={d(".1s")}><Lines text={s.band.s} /></div>
            </div>
          </section>

          {/* FLOW */}
          <section id="flow" className="sec light" data-sec={secs.flow}>
            <div className="wrap">
              <div className="top">
                <div className="head rv" data-px=".05"><h2 className="h2">(How it works)</h2><p className="h2ja">ご利用の流れ</p></div>
                <div className="total rv" style={d(".1s")}><b>{s.flow.total}</b><span>{s.flow.totalSub}</span></div>
              </div>
              <div className="steps">
                {s.flow.steps.map((st, i) => (
                  <div key={st.t} className={`step rv${i === s.flow.steps.length - 1 ? " last" : ""}`} style={d(`${i * 0.1}s`)}>
                    <div className="n">{String(i + 1).padStart(2, "0")}</div>
                    <div className="t">{st.t}</div>
                    <div className="d">{st.d}</div>
                    <div className="x">{st.x}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ENGINEER（池袋店） */}
          {s.engineer && (
            <section id="engineer" className="sec dark" data-sec={secs.mid}>
              <div className="wrap">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.engineer.img} alt={`エンジニア ${s.engineer.name}`} className="rv-img" data-px=".1" loading="lazy" decoding="async" />
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <h2 className="h2 rv" style={{ fontSize: 28 }}>(Engineer)</h2>
                  <div className="name rv" style={d(".08s")}><h2 className="h2">{s.engineer.name}</h2><span style={{ fontSize: 16, color: "var(--gray-l)" }}>{s.engineer.kana}</span></div>
                  {s.engineer.paras.map((p, i) => <p key={i} className="rv" style={d(`${0.16 + i * 0.08}s`)}>{p}</p>)}
                  <div className="chips rv" style={d(".32s")}>{s.engineer.chips.map((c) => <div key={c}>{c}</div>)}</div>
                  <div className="elinks rv" style={d(".4s")}>
                    <div className="lk">
                      <div className="label" style={{ color: "var(--gray-l)" }}>SNS</div>
                      <div className="sns-row">
                        {s.engineer.sns.map((l) => (
                          <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">
                            {l.label === "Instagram" ? <InstagramIcon /> : l.label === "YouTube" ? <YouTubeIcon /> : <TikTokIcon />}{l.label}
                          </a>
                        ))}
                      </div>
                    </div>
                    <div className="lk">
                      <div className="label" style={{ color: "var(--gray-l)" }}>WORKS</div>
                      <div className="ewks">
                        {s.engineer.works.map((w, i) => (
                          <div key={w.t} className="wk">
                            <span className="en n">{String(i + 1).padStart(2, "0")}</span>
                            <div><div className="wt">{w.t}</div><div className="wd">{w.d}</div></div>
                            <div className="wl">{w.links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}<Ext size={14} /></a>)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* WORKS（練馬店） */}
          {s.hasWorks && (
            <section id="works" className="sec dark" data-sec={secs.mid}>
              <div className="wrap">
                <div className="top">
                  <div className="head rv"><h2 className="h2">(Works)</h2><p className="h2ja">制作実績</p></div>
                  <p className="rv" style={d(".1s")}>{s.nameJa}で手がけたレコーディング / MIX / マスタリングの実例です。</p>
                </div>
                <WorksGrid works={works} />
              </div>
            </section>
          )}

          {/* EQUIPMENT */}
          <section id="equipment" className="sec light" data-sec={secs.equipment}>
            <div className="wrap two">
              <div className="head rv sticky" data-px=".05"><h2 className="h2">(Equipment)</h2><p className="h2ja">機材</p></div>
              <div className="eq">
                {s.equipment.map((g, i) => (
                  <div key={g.label} className="card rv" style={d(`${(i % 2) * 0.1}s`)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <div className="im"><img src={g.img} alt="" loading="lazy" decoding="async" /></div>
                    <div className="label">{g.label}</div>
                    <div className="t" style={{ whiteSpace: "pre-line" }}>{g.name}</div>
                    {g.note && <div className="s">{g.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* GALLERY（練馬店） */}
          {s.hasGallery && (
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
          )}

          {/* BAND 2 */}
          <section className="band short" aria-label="">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.band2} alt="" loading="lazy" decoding="async" data-px=".12" />
          </section>

          {/* FAQ */}
          <section id="faq" className="sec dark" data-sec={secs.faq}>
            <div className="wrap two">
              <div className="sticky head rv"><h2 className="h2">(FAQ)</h2><p className="h2ja">よくある質問</p></div>
              <div className="rv" style={d(".1s")}>
                {s.faq.map((f, i) => (
                  <div key={f.q} className={`acc${i === 0 ? " open" : ""}`}>
                    <button type="button" aria-expanded={i === 0}><span className="q">Q</span><span>{f.q}</span><span className="ic"><Plus /></span></button>
                    <div className="a"><div><p>{f.a}</p></div></div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ACCESS */}
          <section id="access" className="sec light" data-sec={secs.access}>
            <div className="wrap two">
              <div className="head rv" data-px=".05"><h2 className="h2">(Access)</h2><p className="h2ja">アクセス</p></div>
              <div className="acc-grid">
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  <div className="rv" style={{ fontSize: 24, fontWeight: 700, lineHeight: 1.5 }}>{s.access.headline}</div>
                  {s.access.routes.map((r, i) => (
                    <div key={i} className="route rv" style={d(`${0.1 + i * 0.05}s`)}><Route stops={r} /></div>
                  ))}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {s.access.notes.map((n, i) => (
                    <div key={n.strong} className="acc-note rv" style={{ ...d(`${0.15 + i * 0.1}s`), ...(i === 0 ? { borderTop: 0, paddingTop: 0 } : {}) }}><strong>{n.strong}</strong><br />{n.text}</div>
                  ))}
                  <a href={`/${other.slug}`} className="acc-note acc-other rv" style={d(".35s")}><strong>{other.nameJa}もあります →</strong><br />{other.access.headline}</a>
                </div>
              </div>
            </div>
          </section>

          {/* CONTACT */}
          <section id="contact" className="sec dark" data-sec={secs.contact}>
            <div className="wrap two">
              <div className="head rv"><h2 className="h2">(Contact)</h2><p className="h2ja">お問い合わせ</p></div>
              <div>
                <p className="rv" style={{ margin: "0 0 20px", fontSize: 15, lineHeight: 1.9, color: "var(--gray-l)" }}>
                  ご予約は<a href={s.bookingUrl} target="_blank" rel="noopener noreferrer" className="ul">予約ページ</a>から。<br />
                  料金・機材・制作の相談など、その他のお問い合わせはこちらからどうぞ。
                </p>
                <div className="cdirect rv" style={d(".05s")}>
                  <a href={s.social.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon />Instagram DM</a>
                  <a href={`mailto:${s.email}`}><MailIcon />{s.email}</a>
                </div>
                <ContactForm to={s.email} studioName={studioName} topics={s.contact.topics} placeholder={s.contact.placeholder} />
              </div>
            </div>
          </section>

          {/* BOOK */}
          <section id="book" className="book dark">
            <div className="deco" data-px=".12" />
            <div className="book-in">
              <div className="ready rv" style={d(".08s")}>
                <span>Ready to</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="lg-wrap"><img src="/connect/logo-connect-lime.svg" alt="CONNECT" className="lg-in" />?</span>
              </div>
              <div className="s rv" style={d(".16s")}><Lines text={s.bookLead} /></div>
              <a href={s.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary rv" style={d(".24s")}><span>{s.nameJa}を予約する</span></a>
              {s.campaign && <div className="camp rv" style={d(".3s")}>紹介した方・された方 1時間無料 — <a href={s.campaign.href}>お友達紹介キャンペーン</a></div>}
            </div>
          </section>

          <Footer current={s} />
        </div>
      </div>

      <ScrollUp />

      <div className="mcta" id="mcta">
        <a href="#price" className="btn btn-ghost" style={{ flex: "0 0 auto", color: "#fff", padding: "0 20px", fontSize: 14 }}>料金</a>
        <a href={s.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ flex: "1 1 auto", fontSize: 15, boxShadow: "0 10px 24px rgba(var(--accent-rgb), .3)" }}>
          {s.nameJa}を予約する
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </a>
      </div>
    </div>
  );
}

/** フッター。トップページと店舗ページで共通 */
export function Footer({ current }: { current?: Studio }) {
  const studios = [STUDIOS.ikebukuro, STUDIOS.nerima];
  return (
    <footer className="ft dark">
      <div className="ft-in">
        <div className="ft-top">
          <div className="ft-brand">
            <a href="/" className="logo" aria-label="CONNECT Studio">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/connect/logo-white.svg" alt="CONNECT" className="lg" />
            </a>
            <p>CONNECT FROM HERE<br />ここから、音楽で繋がる。<br />池袋・練馬のレコーディングスタジオ。</p>
          </div>
          <div className="ft-cols">
            {current && (
              <div className="ft-col">
                <div className="label">MENU</div>
                <a href="#about">About</a><a href="#price">Price</a><a href="#flow">Flow</a>
                {current.engineer && <a href="#engineer">Engineer</a>}
                {current.hasWorks && <a href="#works">Works</a>}
                <a href="#equipment">Equipment</a><a href="#faq">FAQ</a><a href="#access">Access</a><a href="#contact">Contact</a>
              </div>
            )}
            {studios.map((st) => (
              <div key={st.slug} className="ft-col">
                <div className="label">{st.areaEn}</div>
                <a href={`/${st.slug}`} className="ja">CONNECT Studio {st.nameJa}</a>
                <span>{st.footer.area}</span>
                {st.footer.lines.map((l) => <span key={l}>{l}</span>)}
                <span style={{ marginTop: 6 }}>{st.footer.hours}</span>
                <a href={st.bookingUrl} target="_blank" rel="noopener noreferrer" className="ja" style={{ marginTop: 6 }}>予約ページ ↗</a>
                <div className="ft-sns">
                  <a href={st.social.instagram} target="_blank" rel="noopener noreferrer" aria-label={`${st.nameJa} Instagram`}><InstagramIcon /></a>
                  {st.social.youtube && <a href={st.social.youtube} target="_blank" rel="noopener noreferrer" aria-label={`${st.nameJa} YouTube`}><YouTubeIcon /></a>}
                  {st.social.tiktok && <a href={st.social.tiktok} target="_blank" rel="noopener noreferrer" aria-label={`${st.nameJa} TikTok`}><TikTokIcon /></a>}
                  <a href={`mailto:${st.email}`} aria-label={`${st.nameJa} メール`}><MailIcon /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="ft-bottom">
          <div>© CONNECT Studio</div>
          <div>RECORDING STUDIO — IKEBUKURO / NERIMA, TOKYO</div>
        </div>
      </div>
    </footer>
  );
}
