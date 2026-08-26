"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";

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

function pillStyle(active: boolean): CSSProperties {
  return {
    fontSize: 11,
    letterSpacing: ".1em",
    padding: "8px 16px",
    borderRadius: 999,
    border: active ? "1px solid #fff" : "1px solid rgba(255,255,255,.18)",
    background: active ? "#fff" : "transparent",
    color: active ? "#0a0a0a" : "rgba(255,255,255,.7)",
    cursor: "pointer",
    fontWeight: active ? 700 : 500,
  };
}

export function WorksGrid({ works }: { works: WorkItem[] }) {
  const availableRoles = useMemo(
    () => ROLE_ORDER.filter((r) => works.some((w) => w.roles.includes(r))),
    [works],
  );
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
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 28 }}>
          <button type="button" onClick={() => selectFilter(null)} style={pillStyle(filter === null)}>
            ALL
          </button>
          {availableRoles.map((r) => (
            <button key={r} type="button" onClick={() => selectFilter(r)} style={pillStyle(filter === r)}>
              {r}
            </button>
          ))}
        </div>
      )}

      <div className="g2" style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
        {visible.map((w) => (
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
            {w.spotifyTrackId ? (
              <>
                <iframe
                  title={`${w.title} / ${w.artist}`}
                  src={`https://open.spotify.com/embed/${w.spotifyEmbedKind}/${w.spotifyTrackId}?utm_source=generator&theme=0`}
                  width="100%"
                  height="152"
                  style={{ borderRadius: 12, border: "none", display: "block" }}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                />
                {w.note && (
                  <div style={{ fontSize: 11, lineHeight: 1.7, color: "rgba(255,255,255,.4)", marginTop: 12 }}>※ {w.note}</div>
                )}
                {(w.credits || w.links.length > 0) && (
                  <div style={{ marginTop: 14 }}>
                    {w.credits && (
                      <div style={{ fontSize: 11.5, lineHeight: 1.85, color: "rgba(255,255,255,.4)", marginBottom: w.links.length ? 10 : 0 }}>{w.credits}</div>
                    )}
                    {w.links.length > 0 && (
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
                    )}
                  </div>
                )}
              </>
            ) : (
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
                  <div style={{ fontSize: 11.5, lineHeight: 1.85, color: "rgba(255,255,255,.4)", marginBottom: w.note ? 6 : 14 }}>{w.credits}</div>
                  {w.note && (
                    <div style={{ fontSize: 11, lineHeight: 1.7, color: "rgba(255,255,255,.4)", marginBottom: 14 }}>※ {w.note}</div>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
            )}
          </div>
        ))}

        {works.length === 0 && (
          <div style={{ gridColumn: "1 / -1", border: "1px dashed rgba(255,255,255,.14)", borderRadius: 14, padding: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: 180 }}>
            <div style={{ fontSize: 13, letterSpacing: ".16em", color: "rgba(255,255,255,.45)" }}>MORE WORKS COMING SOON</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,.3)", textAlign: "center", maxWidth: "36em" }}>現在準備中です。公開できる制作実績が揃いしだい、こちらに掲載していきます。</div>
          </div>
        )}
        {works.length > 0 && filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1", border: "1px dashed rgba(255,255,255,.14)", borderRadius: 14, padding: 20, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 120 }}>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.4)" }}>「{filter}」に該当するWorksはまだありません。</div>
          </div>
        )}
      </div>

      {remaining > 0 && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 28 }}>
          <button
            type="button"
            onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
            className="hover-outline-sm"
            style={{ fontSize: 12, letterSpacing: ".08em", color: "rgba(255,255,255,.8)", border: "1px solid rgba(255,255,255,.22)", borderRadius: 999, padding: "12px 28px", background: "transparent", cursor: "pointer" }}
          >
            もっと見る（残り{remaining}件）
          </button>
        </div>
      )}
    </>
  );
}
