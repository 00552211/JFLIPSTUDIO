// トップページと店舗ページで共通の小さな部品

/** 初回だけオープニングを流す。描画前に body へクラスを付けて、ちらつきを防ぐ */
export const BOOT_SCRIPT = `try{var r=matchMedia('(prefers-reduced-motion: reduce)').matches;document.body.classList.add(!r&&!sessionStorage.getItem('cs-open')?'booting':'no-open')}catch(e){document.body.classList.add('no-open')}`;

export const d = (s: string) => ({ "--d": s }) as React.CSSProperties;

export function Opening() {
  return (
    <div id="opening" aria-hidden="true">
      <div className="words">
        <span style={{ animationDelay: ".1s" }}>Recording</span>
        <span style={{ animationDelay: ".35s" }}>Mix</span>
        <span style={{ animationDelay: ".6s" }}>Mastering</span>
        <span style={{ animationDelay: ".85s", color: "var(--accent)" }}>CONNECT Studio</span>
      </div>
      <div className="count">Loading <b id="cnt">000</b>%</div>
      <div className="bar"><i id="bar" /></div>
    </div>
  );
}

export const Cursor = () => <div id="cursor" aria-hidden="true" />;

export const Ext = ({ size = 13 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M8 7h9v9" /></svg>
);
export const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
);
export const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>
);
export const YouTubeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2.5" y="6" width="19" height="12" rx="4" /><path d="M10 9.5v5l4.5-2.5z" fill="currentColor" stroke="none" /></svg>
);
export const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 4c.5 2.5 2.2 4 4.5 4.2" /></svg>
);
export const MailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>
);

export function ScrollUp() {
  return (
    <a href="#top" className="up" id="up" aria-label="ページの先頭へ">
      <svg viewBox="0 0 100 100" className="orbit" aria-hidden="true"><defs><path id="circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs><text><textPath href="#circ">SCROLL UP • SCROLL UP • SCROLL UP • </textPath></text></svg>
      <svg className="arr" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7" /></svg>
    </a>
  );
}
