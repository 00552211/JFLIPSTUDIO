"use client";

import { useEffect, useRef, useState } from "react";

/** レコーディング料金（税込・エンジニア込み）。Square の「レコーディング（REC/MIX/MASTER込み）」と揃える */
export const REC_PLANS = [
  { h: 1, price: 5500 },
  { h: 1.5, price: 8250 },
  { h: 2, price: 11000, note: "ボーカルRecやピッチ修正、サクッと利用に" },
  { h: 2.5, price: 13750 },
  { h: 3, price: 15000, note: "1曲を丁寧にレコーディングしたい方向け" },
  { h: 3.5, price: 17500 },
  { h: 4, price: 20000, note: "複数テイクの録音やハモり・コーラスまでじっくり録りたい方向け" },
  { h: 4.5, price: 22500 },
];

const DEFAULT_INDEX = 4; // 3h
const isHot = (h: number) => h >= 3; // 3時間以上は1時間あたり ¥5,000
const fmt = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

export function PriceSlider() {
  const [i, setI] = useState(DEFAULT_INDEX);
  const priceRef = useRef<HTMLDivElement>(null);
  const plan = REC_PLANS[i];
  const last = REC_PLANS.length - 1;

  // 値が変わるたびに金額を少し弾ませる
  useEffect(() => {
    const el = priceRef.current;
    if (!el) return;
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }, [i]);

  return (
    <div className="card pbox rv" style={{ "--d": ".15s" } as React.CSSProperties}>
      <div className="top">
        <div>
          <div className="label" style={{ marginBottom: 12, color: "var(--gray-l)" }}>SELECT TIME</div>
          <div className="hours"><b>{plan.h}</b>h</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, maxWidth: "100%" }}>
          <span className={`tag${plan.note ? " on" : ""}`}>{plan.note ?? " "}</span>
          <div className="price" ref={priceRef}>{fmt(plan.price)}<small>税込</small></div>
        </div>
      </div>
      <div>
        <input
          type="range"
          className="range"
          min={0}
          max={last}
          step={1}
          value={i}
          onChange={(e) => setI(Number(e.target.value))}
          aria-label="利用時間"
          aria-valuetext={`${plan.h}時間 ${fmt(plan.price)}`}
          style={{ "--p": `${(i / last) * 100}%` } as React.CSSProperties}
        />
        <div className="ticks">
          {REC_PLANS.map((p) => <span key={p.h} className={isHot(p.h) ? "hot" : ""}>{p.h}h</span>)}
        </div>
      </div>
      <div className="psub"><span className="pb"><b>3h〜</b>¥5,000 / h</span>3時間以上は1時間あたり ¥5,000。長く録るほどおトクです。</div>
      <div className="pnote">
        <div><Check />30分単位で選べます</div>
        <div><Check />エンジニア立ち合い込み</div>
        <div><Check />表示はすべて税込</div>
      </div>
      <details className="all">
        <summary>
          料金表をすべて見る
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </summary>
        <div className="pgrid">
          {REC_PLANS.map((p) => (
            <div key={p.h} className={isHot(p.h) ? "hot" : ""}><span>{p.h}h</span><b>{fmt(p.price)}</b></div>
          ))}
        </div>
      </details>
    </div>
  );
}
