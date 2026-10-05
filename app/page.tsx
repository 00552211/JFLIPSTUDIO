import { IKEBUKURO, NERIMA, type Studio } from "@/lib/studios";
import { Footer } from "@/components/studio-page";
import { HomeEffects } from "./home-effects";
import { BOOT_SCRIPT, Opening, Cursor, ScrollUp, d } from "@/components/studio-parts";
import "./home.css";

// トップは2店舗の入り口。写真は両店舗のものを交互に流す
const SLIDES = [IKEBUKURO.hero.slides[0], NERIMA.hero.slides[0], IKEBUKURO.hero.slides[1], NERIMA.hero.slides[1], IKEBUKURO.hero.slides[5], NERIMA.hero.slides[3]];
const fmt = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

function StoreCard({ s, i }: { s: Studio; i: number }) {
  const from = s.price.plans[0];
  const per = s.price.perHour.replace(" / h", "");
  return (
    <div className="card scard rv" style={d(`${i * 0.12}s`)}>
      <a href={`/${s.slug}`} className="im" aria-label={`CONNECT Studio ${s.nameJa}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.hero.slides[0]} alt="" loading="lazy" decoding="async" />
        <span className="area">{s.areaEn}</span>
      </a>
      <div className="bd">
        <div className="nm">CONNECT Studio <b>{s.nameJa}</b></div>
        <p>{s.hero.lead}。{s.hero.big}{s.hero.em}</p>
        <dl>
          <div><dt>ACCESS</dt><dd>{s.footer.lines[0]}</dd></div>
          <div><dt>OPEN</dt><dd>{s.footer.hours}</dd></div>
          <div><dt>PRICE</dt><dd>{from.h}h {fmt(from.price)}〜 / {s.price.hotFrom}h以上は1時間 {per}</dd></div>
          <div><dt>ENGINEER</dt><dd>{s.engineerName}</dd></div>
        </dl>
        <div className="acts">
          <a href={`/${s.slug}`} className="btn btn-black"><span>{s.nameJa}を見る</span></a>
          <a href={s.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost"><span>予約する</span></a>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="jf">
      <script dangerouslySetInnerHTML={{ __html: BOOT_SCRIPT }} />
      <HomeEffects />
      <Opening />
      <Cursor />

      <div className="gh-bg" aria-hidden="true" />
      <header className="gh">
        <a href="#top" className="logo blend" aria-label="CONNECT Studio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/connect/logo-white.svg" alt="CONNECT" className="lg" />
        </a>
        <div className="right">
          <nav className="gnav top blend">
            <a href="/ikebukuro">IKEBUKURO</a>
            <a href="/nerima">NERIMA</a>
          </nav>
          <a href="#studios" className="btn btn-primary"><span>店舗を選んで予約</span></a>
        </div>
      </header>

      <div id="page">
        <section className="hero" id="top">
          <div className="slides" id="slides" aria-hidden="true">
            {SLIDES.map((src, i) =>
              i === 0
                // eslint-disable-next-line @next/next/no-img-element
                ? <img key={src} className="sl on" src={src} alt="" fetchPriority="high" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img key={src} className="sl" data-src={src} alt="" />,
            )}
          </div>
          <a href="#studios" className="mark" aria-label="店舗を選ぶ">
            <svg viewBox="0 0 200 200" className="orbit" aria-hidden="true">
              <defs><path id="mc" d="M100,100 m-68,0 a68,68 0 1,1 136,0 a68,68 0 1,1 -136,0" /></defs>
              <text><textPath href="#mc" textLength="427" lengthAdjust="spacing">• CONNECT STUDIO • IKEBUKURO • NERIMA • REC </textPath></text>
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <span className="core"><img src="/connect/mark-lime.svg" alt="" /></span>
          </a>
          <canvas className="grain" id="grain" aria-hidden="true" />
          <div className="dots" id="dots" />
          <div className="bg" id="heroBg" />
          <div className="shade" />
          <div className="scroll">Scroll<i /></div>
          <div className="inner">
            <div className="hlead">池袋・練馬のレコーディングスタジオ</div>
            <h1 className="big">エンジニア付き。<em>その場で完結。</em></h1>
            <div className="sub en">CONNECT FROM HERE — IKEBUKURO / NERIMA, TOKYO</div>
          </div>
        </section>
        <div className="hero-space" />

        <div className="after">
          <section className="light">
            <div className="marquee" aria-hidden="true">
              <div className="track">
                {[0, 1].map((k) => ["RECORDING", "MIX", "MASTERING", "ENGINEER INCLUDED", "IKEBUKURO", "NERIMA", "TOKYO"].map((w) => <span key={`${k}${w}`}>{w}</span>))}
              </div>
            </div>
          </section>

          <section id="studios" className="sec light">
            <div className="wrap">
              <div className="top-hd">
                <div className="head rv"><h2 className="h2">(Studios)</h2><p className="h2ja">店舗を選ぶ</p></div>
                <p className="rv" style={d(".1s")}>エンジニア付きで、RECからMIX / MASTERまでその場で完結。<br />通いやすい店舗を選んでください。</p>
              </div>
              <div className="stores">
                <StoreCard s={IKEBUKURO} i={0} />
                <StoreCard s={NERIMA} i={1} />
              </div>
            </div>
          </section>

          <section id="book" className="book dark">
            <div className="deco" data-px=".12" />
            <div className="book-in">
              <div className="ready rv" style={d(".08s")}>
                <span>Ready to</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <span className="lg-wrap"><img src="/connect/logo-connect-lime.svg" alt="CONNECT" className="lg-in" />?</span>
              </div>
              <div className="s rv" style={d(".16s")}>ここから、音楽で繋がる。<br />Trackを持って、予約ページから日時と時間を選ぶだけ。</div>
              <div className="book-2 rv" style={d(".24s")}>
                <a href={IKEBUKURO.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><span>池袋店を予約</span></a>
                <a href={NERIMA.bookingUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary"><span>練馬店を予約</span></a>
              </div>
            </div>
          </section>

          <Footer />
        </div>
      </div>

      <ScrollUp />
    </div>
  );
}
