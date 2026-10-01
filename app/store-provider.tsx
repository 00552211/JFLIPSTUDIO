"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { STORE2_ENABLED, STORES, type Store, type StoreId } from "@/lib/stores";

const Ctx = createContext<{ store: Store; setStoreId: (id: StoreId) => void }>({
  store: STORES["1"],
  setStoreId: () => {},
});

export const useStore = () => useContext(Ctx);

/**
 * 選択中の店舗を保持する。店舗ごとの文言は両方HTMLに出したうえで、
 * ラッパーの data-store 属性と globals.css の .only-s1 / .only-s2 で出し分ける。
 * URLの ?store=2 でも指定できる（共有用）。
 */
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [id, setId] = useState<StoreId>("1");

  useEffect(() => {
    if (STORE2_ENABLED && new URLSearchParams(window.location.search).get("store") === "2") setId("2");
  }, []);

  const setStoreId = useCallback((next: StoreId) => {
    setId(next);
    const url = new URL(window.location.href);
    if (next === "2") url.searchParams.set("store", "2");
    else url.searchParams.delete("store");
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <Ctx.Provider value={{ store: STORES[id], setStoreId }}>
      <div data-store={id} style={{ background: "#0a0a0a", minHeight: "100vh" }}>
        {children}
      </div>
    </Ctx.Provider>
  );
}

/**
 * 店舗の切り替えボタン。
 * - row: PC用。ヘッダーの下に1段で出す
 * - compact: タブレット用。ヘッダー1段目に収める
 * - phone: スマホ(520px以下)用。2段目のメニューの左端に置き、1段目はロゴと予約ボタンに使う
 * どれを見せるかは globals.css（.sw-row / .sw-compact / .sw-phone）で幅に応じて切り替える。
 */
export function StoreSwitch({ variant = "row" }: { variant?: "row" | "compact" | "phone" }) {
  const compact = variant !== "row";
  const { store, setStoreId } = useStore();
  if (!STORE2_ENABLED) return null; // 2号店が未公開の間は切り替えボタン自体を出さない
  return (
    <div
      role="group"
      aria-label="店舗を選ぶ"
      className={variant === "phone" ? "sw-phone" : compact ? "sw-compact" : "sw-row"}
      style={
        compact
          ? { gap: 4, padding: 3, borderRadius: 999, border: "1px solid rgba(255,255,255,.18)", flex: "none" }
          : { display: "flex", justifyContent: "center", gap: 8, padding: "0 20px 12px" }
      }
    >
      {Object.values(STORES).map((s) => {
        const active = s.id === store.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setStoreId(s.id)}
            aria-pressed={active}
            aria-label={s.label}
            style={{
              fontSize: compact ? 12 : 12,
              fontWeight: 700,
              letterSpacing: compact ? ".02em" : ".08em",
              padding: compact ? "7px 12px" : "8px 18px",
              minHeight: compact ? 34 : undefined,
              borderRadius: 999,
              cursor: "pointer",
              whiteSpace: "nowrap",
              background: active ? "#fff" : "transparent",
              color: active ? "#0a0a0a" : "rgba(255,255,255,.7)",
              border: compact ? "none" : active ? "1px solid #fff" : "1px solid rgba(255,255,255,.18)",
            }}
          >
            {compact ? `${s.id}号店` : s.label}
          </button>
        );
      })}
    </div>
  );
}
