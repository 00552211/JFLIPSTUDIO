"use client";

import { useEffect, useRef, useState } from "react";
import type { Studio } from "@/lib/studios";

const fmt = (n: number) => `¥${n.toLocaleString("ja-JP")}`;
const Check = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

/** レコーディング料金（税込・エンジニア込み）のスライダー。料金は lib/studios.ts の店舗データから受け取る */
export function PriceSlider({ price }: { price: Studio["price"] }) {
  const { plans, hotFrom } = price;
  const [i, setI] = useState(price.defaultIndex);
  const priceRef = useRef<HTMLDivElement>(null);
  const plan = plans[i];
  const last = plans.length - 1;
  const isHot = (h: number) => h >= hotFrom;

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
          {/* 目盛りはスライダーのつまみと同じ位置に置く（整数の時間と最後のプラン） */}
          {plans.map((p, k) => (Number.isInteger(p.h) || k === last) && (
            <span
              key={p.h}
              className={isHot(p.h) ? "hot" : ""}
              style={{ left: `${(k / last) * 100}%`, transform: `translateX(${k === 0 ? 0 : k === last ? -100 : -50}%)` }}
            >
              {p.h}h
            </span>
          ))}
        </div>
      </div>
      <div className="psub"><span className="pb"><b>{hotFrom}h〜</b>{price.perHour}</span>{price.perHourText}</div>
      <div className="pnote">
        {price.checks.map((c) => <div key={c}><Check />{c}</div>)}
      </div>
      <details className="all">
        <summary>
          料金表をすべて見る
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </summary>
        <div className="pgrid">
          {plans.map((p) => (
            <div key={p.h} className={isHot(p.h) ? "hot" : ""}><span>{p.h}h</span><b>{fmt(p.price)}</b></div>
          ))}
        </div>
      </details>
    </div>
  );
}
