"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { STORES, type Store, type StoreId } from "@/lib/stores";

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
    if (new URLSearchParams(window.location.search).get("store") === "2") setId("2");
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

export function StoreSwitch() {
  const { store, setStoreId } = useStore();
  return (
    <div
      role="group"
      aria-label="店舗を選ぶ"
      style={{ display: "flex", justifyContent: "center", gap: 8, padding: "0 20px 12px" }}
    >
      {Object.values(STORES).map((s) => {
        const active = s.id === store.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => setStoreId(s.id)}
            aria-pressed={active}
            style={{
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: ".08em",
              padding: "8px 18px",
              borderRadius: 999,
              cursor: "pointer",
              background: active ? "#fff" : "transparent",
              color: active ? "#0a0a0a" : "rgba(255,255,255,.6)",
              border: active ? "1px solid #fff" : "1px solid rgba(255,255,255,.18)",
            }}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
