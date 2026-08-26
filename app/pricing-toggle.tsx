"use client";

import { useState } from "react";

const PILL =
  "font-size:13px;font-weight:700;padding:12px 24px;border-radius:999px;cursor:pointer;user-select:none;transition:all .18s";

type Plan = { name: string; detail: string; hourly: string; price: string };

const REC: Plan[] = [
  { name: "通常利用", detail: "2時間", hourly: "1h ¥4,500", price: "¥9,000" },
  { name: "3hパック", detail: "3時間", hourly: "1h ¥4,333", price: "¥13,000" },
  { name: "5hパック", detail: "5時間", hourly: "1h ¥4,300", price: "¥21,500" },
  { name: "6hパック", detail: "6時間", hourly: "1h ¥4,250", price: "¥25,500" },
  { name: "10hパック", detail: "10時間", hourly: "1h ¥4,000 ★", price: "¥40,000" },
];

const MIX: Plan[] = [
  { name: "MIX / MASTERING（2mix納品）", detail: "オンライン / 1曲", hourly: "一律", price: "¥7,000〜" },
  { name: "パラ・ステムからのMIX", detail: "オンライン / 1曲", hourly: "", price: "¥12,000〜" },
  { name: "リテイク（修正）", detail: "回数無制限", hourly: "", price: "込み" },
];

export function PricingToggle() {
  const [tab, setTab] = useState<"rec" | "mix">("rec");
  const isRec = tab === "rec";
  const plans = isRec ? REC : MIX;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div
          onClick={() => setTab("rec")}
          style={parseInlineStyle(
            PILL + (isRec ? ";background:#fff;color:#0a0a0a" : ";background:transparent;color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.16)"),
          )}
        >
          レコーディング
        </div>
        <div
          onClick={() => setTab("mix")}
          style={parseInlineStyle(
            PILL + (!isRec ? ";background:#fff;color:#0a0a0a" : ";background:transparent;color:rgba(255,255,255,.55);border:1px solid rgba(255,255,255,.16)"),
          )}
        >
          MIX / MASTERING
        </div>
      </div>

      {isRec && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            background: "#fff",
            color: "#0a0a0a",
            borderRadius: 14,
            padding: "20px 26px",
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: ".26em",
              fontWeight: 700,
              border: "1px solid rgba(10,10,10,.25)",
              borderRadius: 999,
              padding: "5px 12px",
            }}
          >
            BEST VALUE
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-.02em" }}>1時間あたり ¥4,000</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.7, color: "rgba(10,10,10,.62)", flex: 1, minWidth: 220 }}>
            10hパック（¥40,000）ご利用時。エンジニア立ち合い込みで、この地域では最安水準の時間単価です。
          </div>
        </div>
      )}

      {!isRec && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <span
            style={{
              fontSize: 9.5,
              letterSpacing: ".24em",
              color: "#0a0a0a",
              background: "#fff",
              borderRadius: 999,
              padding: "5px 12px",
              fontWeight: 700,
            }}
          >
            ONLINE ONLY
          </span>
          <span style={{ fontSize: 12.5, color: "rgba(255,255,255,.55)" }}>
            MIX / MASTERING はオンライン納品のみの対応です
          </span>
        </div>
      )}

      <div style={{ background: "#141414", border: "1px solid rgba(255,255,255,.09)", borderRadius: 14, overflow: "hidden" }}>
        {plans.map((p) => (
          <div
            key={p.name}
            className="plan-row"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 20,
              padding: "20px 28px",
              borderBottom: "1px solid rgba(255,255,255,.07)",
            }}
          >
            <span style={{ fontSize: 14.5, fontWeight: 500, flex: 1 }}>{p.name}</span>
            <span style={{ fontSize: 12, letterSpacing: ".1em", color: "rgba(255,255,255,.42)", width: 110 }}>
              {p.detail}
            </span>
            <span style={{ fontSize: 11.5, letterSpacing: ".08em", color: "rgba(255,255,255,.5)", width: 104, textAlign: "right" }}>
              {p.hourly}
            </span>
            <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-.01em", width: 120, textAlign: "right" }}>
              {p.price}
            </span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 28px",
            background: "#171717",
            borderBottom: "1px solid rgba(255,255,255,.07)",
          }}
        >
          <span style={{ fontSize: 11, letterSpacing: ".2em", color: "rgba(255,255,255,.5)" }}>
            {isRec ? "EXTENSION（延長料金）" : "RETAKE（リテイク）"}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)" }}>
            {isRec ? "10分 ¥1,200 / 30分 ¥2,300" : "無制限（追加料金なし）"}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px" }}>
          <span style={{ fontSize: 11, letterSpacing: ".2em", color: "rgba(255,255,255,.5)" }}>
            {isRec ? "PAYMENT（お支払い方法）" : "DELIVERY（納品形式）"}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,.75)" }}>
            {isRec ? "現金 / クレジットカード（タッチ決済対応）" : "オンライン対応 / WAV・MP3でデータ納品"}
          </span>
        </div>
      </div>

      <p style={{ fontSize: 11.5, lineHeight: 1.9, color: "rgba(255,255,255,.38)", margin: "18px 0 0", maxWidth: "64em", textWrap: "pretty" }}>
        {isRec
          ? "※ 表示価格は全て税込・エンジニア込みの価格です。法人のお客様は別途お問い合わせください。"
          : "※ MIX / MASTERING はオンラインのみの対応です。上記は最低料金で、トラック数・楽曲の尺・納期によって変動します。正確なお見積りはメールまたはInstagramのDMからお問い合わせください。"}
      </p>

      {isRec && (
        <div style={{ display: "flex", justifyContent: "center", marginTop: 34 }}>
          <a
            href="https://book.squareup.com/appointments/atrhlg3x3adiil/location/LJFDVKXY7Y7PC/services"
            target="_blank"
            rel="noopener noreferrer"
            className="hover-lift"
            style={{ background: "#fff", color: "#0a0a0a", fontSize: 13, fontWeight: 700, padding: "15px 40px", borderRadius: 999 }}
          >
            WEBで予約する
          </a>
        </div>
      )}

      {!isRec && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginTop: 34 }}>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", margin: 0, textAlign: "center" }}>
            楽曲の内容をお知らせいただければ、正式なお見積りをお送りします。
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <a
              href="mailto:jfliponthegame@gmail.com"
              className="hover-lift"
              style={{ background: "#fff", color: "#0a0a0a", fontSize: 13, fontWeight: 700, padding: "15px 32px", borderRadius: 999 }}
            >
              メールで見積りを依頼
            </a>
            <a
              href="https://www.instagram.com/jfliponthegame/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover-outline"
              style={{ border: "1px solid rgba(255,255,255,.22)", color: "rgba(255,255,255,.82)", fontSize: 13, padding: "15px 32px", borderRadius: 999 }}
            >
              InstagramでDM ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

/** "font-size:13px;font-weight:700" 形式のCSS文字列を React style object に変換する簡易パーサ */
function parseInlineStyle(css: string): React.CSSProperties {
  const style: Record<string, string> = {};
  for (const decl of css.split(";")) {
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    if (!prop || !value) continue;
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    style[camel] = value;
  }
  return style as React.CSSProperties;
}
