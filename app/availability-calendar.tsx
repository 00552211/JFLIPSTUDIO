"use client";

import { useCallback, useEffect, useState } from "react";

const BOOKING =
  "https://book.squareup.com/appointments/atrhlg3x3adiil/location/LJFDVKXY7Y7PC/services";
const INSTAGRAM_URL = "https://www.instagram.com/jfliponthegame/";
const WD = ["月", "火", "水", "木", "金", "土", "日"];

type DayStatus = "open" | "few" | "full" | "closed";

/** APIが使えないときのみのフォールバック（目安表示） */
function fallbackFor(date: Date): DayStatus {
  if (date.getDay() === 0) return "closed";
  const seed = (date.getDate() * 7 + date.getMonth() * 3) % 10;
  return seed < 5 ? "open" : seed < 8 ? "few" : "full";
}

const CELL: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  aspectRatio: "1/1", borderRadius: 8, textDecoration: "none",
  transition: "transform .2s cubic-bezier(.22,.7,.3,1), background-color .2s ease, border-color .2s ease",
};

const STYLES: Record<DayStatus | "past" | "blank", React.CSSProperties> = {
  open: { ...CELL, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.28)", color: "#fff", cursor: "pointer" },
  few: { ...CELL, border: "1px solid rgba(255,255,255,.14)", color: "rgba(255,255,255,.6)", cursor: "pointer" },
  full: { ...CELL, border: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.22)", pointerEvents: "none" },
  closed: { ...CELL, border: "1px solid rgba(255,255,255,.07)", color: "rgba(255,255,255,.22)", pointerEvents: "none" },
  past: { ...CELL, border: "1px solid rgba(255,255,255,.05)", color: "rgba(255,255,255,.16)", pointerEvents: "none" },
  blank: { ...CELL, border: "1px solid transparent", pointerEvents: "none" },
};

const MARK: Record<string, string> = { open: "◎", few: "△", full: "×", closed: "定休", past: "", blank: "" };

const navBtn: React.CSSProperties = {
  width: 38, height: 38, border: "1px solid rgba(255,255,255,.16)", borderRadius: 10,
  display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
  fontSize: 14, color: "rgba(255,255,255,.7)", userSelect: "none", background: "transparent",
};

/** カレンダーに表示するのは今月・来月まで。それ以降はDM/メールに誘導する。 */
const MAX_OFFSET = 1;

export function AvailabilityCalendar() {
  const [offset, setOffset] = useState(0);
  const [live, setLive] = useState<Record<string, DayStatus> | null>(null);
  const atMax = offset >= MAX_OFFSET;

  const now = new Date();
  const base = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const y = base.getFullYear();
  const m = base.getMonth();
  const month = `${y}-${String(m + 1).padStart(2, "0")}`;

  const load = useCallback(async (monthKey: string) => {
    try {
      const res = await fetch(`/api/availability?month=${monthKey}`);
      const json = await res.json();
      setLive(json.ok ? (json.days as Record<string, DayStatus>) : null);
    } catch {
      setLive(null);
    }
  }, []);

  useEffect(() => { setLive(null); void load(month); }, [month, load]);

  const firstCol = (new Date(y, m, 1).getDay() + 6) % 7; // 月曜始まり
  const total = new Date(y, m + 1, 0).getDate();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const cells: { key: string; num: string; kind: keyof typeof STYLES }[] = [];
  for (let i = 0; i < firstCol; i++) cells.push({ key: `b${i}`, num: "", kind: "blank" });
  for (let d = 1; d <= total; d++) {
    const date = new Date(y, m, d);
    const key = `${month}-${String(d).padStart(2, "0")}`;
    cells.push({ key, num: String(d), kind: date < today ? "past" : live?.[key] ?? fallbackFor(date) });
  }

  return (
    <section id="availability" style={{ borderTop: "1px solid rgba(255,255,255,.08)" }}>
      <div className="wrap" style={{ maxWidth: 1180, margin: "0 auto", padding: "88px 32px" }}>
        <div className="works-hd" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, marginBottom: 12 }}>
          <div>
            <p style={{ fontSize: 10.5, letterSpacing: ".32em", color: "rgba(255,255,255,.42)", margin: "0 0 18px" }}>AVAILABILITY</p>
            <h2 className="h-sec" style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-.01em" }}>予約状況カレンダー</h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button className="hover-outline-sm" style={navBtn} onClick={() => setOffset((o) => Math.max(0, o - 1))} aria-label="前の月">‹</button>
            <div style={{ fontSize: 15, fontWeight: 700, minWidth: 118, textAlign: "center" }}>{y}年 {m + 1}月</div>
            <button
              className="hover-outline-sm"
              style={atMax ? { ...navBtn, opacity: 0.3, cursor: "not-allowed" } : navBtn}
              onClick={() => setOffset((o) => Math.min(MAX_OFFSET, o + 1))}
              aria-label="次の月"
              aria-disabled={atMax}
              disabled={atMax}
            >
              ›
            </button>
          </div>
        </div>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,.55)", margin: "0 0 26px" }}>
          空き状況の目安です。日付を選ぶと、その日の予約ページが開きます。
        </p>

        <div style={{ background: "#111", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, padding: "22px 20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6, marginBottom: 8 }}>
            {WD.map((label, i) => (
              <div key={label} style={{ textAlign: "center", fontSize: 10, letterSpacing: ".14em", paddingBottom: 6, color: i === 6 ? "rgba(255,255,255,.3)" : i === 5 ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.42)" }}>{label}</div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
            {cells.map((c) => {
              const clickable = c.kind === "open" || c.kind === "few";
              const inner = (
                <>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{c.num}</span>
                  <span style={{ fontSize: 9.5, letterSpacing: ".06em", marginTop: 3 }}>{MARK[c.kind]}</span>
                </>
              );
              return clickable ? (
                <a key={c.key} href={BOOKING} target="_blank" rel="noopener noreferrer" style={STYLES[c.kind]}>{inner}</a>
              ) : (
                <div key={c.key} style={STYLES[c.kind]}>{inner}</div>
              );
            })}
          </div>
        </div>

        <div className="cal-legend" style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap", marginTop: 18 }}>
          {([["open", "空きあり"], ["few", "残りわずか"], ["full", "満席・定休"]] as const).map(([k, label]) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...STYLES[k], width: 22, height: 22, aspectRatio: "auto", borderRadius: 6, fontSize: 9.5 }}>{MARK[k]}</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>{label}</span>
            </div>
          ))}
          <a className="hover-lift" href={BOOKING} target="_blank" rel="noopener noreferrer" style={{ marginLeft: "auto", background: "#fff", color: "#0a0a0a", fontSize: 12.5, fontWeight: 700, padding: "12px 24px", borderRadius: 999 }}>今すぐ予約する</a>
        </div>
        <p style={{ fontSize: 11.5, lineHeight: 1.9, color: "rgba(255,255,255,.34)", margin: "16px 0 0" }}>
          ※ {live ? "Googleカレンダーの予定から自動反映しています。" : "現在は目安表示です。確定した空き枠は予約ページでご確認ください。"}　日曜は定休日です。
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.9, color: "rgba(255,255,255,.5)", margin: "10px 0 0" }}>
          再来月以降のご予約・空き状況は、
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="hover-link" style={{ color: "inherit", textDecoration: "underline" }}>Instagram DM</a>
          または
          <a href="mailto:jfliponthegame@gmail.com" className="hover-link" style={{ color: "inherit", textDecoration: "underline" }}>メール（jfliponthegame@gmail.com）</a>
          にてお問い合わせください。
        </p>
      </div>
    </section>
  );
}
