"use client";

import { useEffect, useState } from "react";

type DayStatus = "open" | "few" | "full" | "closed";
type MonthData = Record<string, DayStatus>;

const W = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const MARK: Record<DayStatus | "na", { m: string; cls: string; aria: string }> = {
  open: { m: "○", cls: "ok", aria: "空きあり" },
  few: { m: "△", cls: "few", aria: "残りわずか" },
  full: { m: "×", cls: "full", aria: "空きなし" },
  closed: { m: "定休", cls: "closed", aria: "定休日" },
  na: { m: "—", cls: "na", aria: "予約ページで確認" },
};
/** カレンダーに出すのは今月・来月まで。それ以降はDM/メールに誘導する */
const MONTHS = 2;
const pad = (n: number) => String(n).padStart(2, "0");

/** 1号店の空き状況（/api/availability がGoogleカレンダーから ○△× を返す）を2ヶ月分並べる */
export function AvailabilityCalendar({ bookingUrl }: { bookingUrl: string }) {
  const [today, setToday] = useState<Date | null>(null);
  const [data, setData] = useState<MonthData | null>(null);
  const [state, setState] = useState<"loading" | "live" | "error">("loading");
  const [updated, setUpdated] = useState("");

  useEffect(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    setToday(t);
    const keys = Array.from({ length: MONTHS }, (_, m) => {
      const d = new Date(t.getFullYear(), t.getMonth() + m, 1);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    });
    Promise.all(keys.map((k) => fetch(`/api/availability?month=${k}`).then((r) => r.json())))
      .then((res: { ok: boolean; days: MonthData }[]) => {
        if (!res.every((r) => r.ok)) throw new Error("unavailable");
        setData(Object.assign({}, ...res.map((r) => r.days)));
        setState("live");
        setUpdated(new Date().toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => setState("error"));
  }, []);

  if (!today) return <div className="avmonths" style={{ minHeight: 360 }} />;

  return (
    <>
      <div className="avmonths">
        {Array.from({ length: MONTHS }, (_, m) => {
          const first = new Date(today.getFullYear(), today.getMonth() + m, 1);
          const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
          return (
            <div key={m}>
              <div className="avm-t">{first.getMonth() + 1}月 <span>{first.getFullYear()}</span></div>
              <div className="avgrid">
                {W.map((w, i) => <div key={w} className={`avw s${i}`}>{w[0]}</div>)}
                {Array.from({ length: first.getDay() }, (_, i) => <div key={`p${i}`} className="avd pad" />)}
                {Array.from({ length: last }, (_, k) => {
                  const d = k + 1;
                  const date = new Date(first.getFullYear(), first.getMonth(), d);
                  const past = date < today;
                  const key = `${first.getFullYear()}-${pad(first.getMonth() + 1)}-${pad(d)}`;
                  const st = MARK[data?.[key] ?? (date.getDay() === 0 ? "closed" : "na")];
                  const inner = <><span className="d">{d}</span><span className="m">{past ? "" : st.m}</span></>;
                  if (past) return <div key={d} className="avd past">{inner}</div>;
                  const label = `${first.getMonth() + 1}月${d}日 ${st.aria}`;
                  return st.cls === "full" || st.cls === "closed"
                    ? <div key={d} className={`avd ${st.cls}`} aria-label={label}>{inner}</div>
                    : <a key={d} className={`avd ${st.cls}`} href={bookingUrl} target="_blank" rel="noopener noreferrer" aria-label={label}>{inner}</a>;
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="av-note">
        日付をタップすると予約ページへ移動します。
        <span>{state === "live" ? `（${updated} 時点・Googleカレンダーから自動反映）` : state === "error" ? "（最新の空き状況は予約ページでご確認ください）" : ""}</span>
        <br />
        再来月以降のご予約は <a href="https://www.instagram.com/jfliponthegame/" target="_blank" rel="noopener noreferrer">Instagram DM</a> または <a href="mailto:jfliponthegame@gmail.com">メール</a> でお問い合わせください。
      </div>
    </>
  );
}
