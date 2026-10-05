"use client";

import { useMemo, useState } from "react";

export type WorkLink = { label: string; url: string };
export type WorkItem = {
  id: string;
  title: string;
  artist: string;
  year: string;
  roles: string[];
  credits: string;
  jacketUrl: string | null;
  spotifyTrackId: string | null;
  /** spotify_url に含まれる /track/ か /album/ から判定。埋め込みURLの種別に必要 */
  spotifyEmbedKind: "track" | "album";
  /** 「アルバム収録曲のうち一部だけ担当」等の補足。カードに小さく表示する */
  note: string | null;
  links: WorkLink[];
};

const ROLE_ORDER = ["REC", "MIX", "MASTER", "PRODUCE"] as const;
const PAGE_SIZE = 6;
const Arrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M8 7h9v9" /></svg>
);

function Links({ links }: { links: WorkLink[] }) {
  if (!links.length) return null;
  return (
    <div className="wl">
      {links.map((l) => <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer">{l.label}<Arrow /></a>)}
    </div>
  );
}

export function WorksGrid({ works }: { works: WorkItem[] }) {
  const availableRoles = useMemo(() => ROLE_ORDER.filter((r) => works.some((w) => w.roles.includes(r))), [works]);
  const [filter, setFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = filter ? works.filter((w) => w.roles.includes(filter)) : works;
  const visible = filtered.slice(0, visibleCount);
  const remaining = filtered.length - visible.length;

  const selectFilter = (next: string | null) => {
    setFilter(next);
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <>
      {availableRoles.length > 1 && (
        <div className="wfil rv">
          <button type="button" className={filter === null ? "on" : ""} onClick={() => selectFilter(null)}>ALL</button>
          {availableRoles.map((r) => (
            <button key={r} type="button" className={filter === r ? "on" : ""} onClick={() => selectFilter(r)}>{r}</button>
          ))}
        </div>
      )}

      <div className="wgrid">
        {visible.map((w, i) => (
          <div key={w.id} className="card wcard rv" style={{ "--d": `${(i % 2) * 0.08}s` } as React.CSSProperties}>
            <div className="meta">
              <div className="roles">{w.roles.map((r) => <span key={r}>{r}</span>)}</div>
              <span className="yr">{w.year}</span>
            </div>
            {w.spotifyTrackId ? (
              <>
                <iframe
                  title={`${w.title} / ${w.artist}`}
                  src={`https://open.spotify.com/embed/${w.spotifyEmbedKind}/${w.spotifyTrackId}?utm_source=generator&theme=0`}
                  // アルバムはトラックリストが入るため、トラック単体より高さを大きく取る
                  height={w.spotifyEmbedKind === "album" ? 352 : 152}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
                {w.note && <div className="cr">※ {w.note}</div>}
                {w.credits && <div className="cr">{w.credits}</div>}
                <Links links={w.links} />
              </>
            ) : (
              <div className="solo">
                {w.jacketUrl
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img className="jk" src={w.jacketUrl} alt="" loading="lazy" />
                  : <div className="jk" />}
                <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div>
                    <div className="wt">{w.title}</div>
                    <div className="wa">{w.artist}</div>
                  </div>
                  {w.credits && <div className="cr">{w.credits}</div>}
                  {w.note && <div className="cr">※ {w.note}</div>}
                  <Links links={w.links} />
                </div>
              </div>
            )}
          </div>
        ))}

        {works.length === 0 && (
          <div className="wempty">
            <b>MORE WORKS COMING SOON</b>
            <span>公開できる制作実績が揃いしだい、こちらに掲載していきます。</span>
          </div>
        )}
        {works.length > 0 && filtered.length === 0 && (
          <div className="wempty"><span>「{filter}」に該当するWorksはまだありません。</span></div>
        )}
      </div>

      {remaining > 0 && (
        <div className="wmore">
          <button type="button" className="btn btn-ghost" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
            <span>もっと見る（残り{remaining}件）</span>
          </button>
        </div>
      )}
    </>
  );
}
