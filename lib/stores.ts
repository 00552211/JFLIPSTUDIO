// 店舗ごとの情報。1号店・2号店で内容が違うものはここに集約する。
// ※ 2号店の最寄り駅・定休日・お支払い方法は未確定のため、表示側で出し分けている。
import { STORE_2 } from "./store2";

export type StoreId = "1" | "2";

export type Plan = { name: string; detail: string; hourly: string; price: string };

export type Store = {
  id: StoreId;
  label: string;          // 切り替えボタンの表示
  name: string;
  area: string;
  hours: string;
  closed: string | null;  // 定休日の表示。未確定ならnull
  bookingUrl: string;
  bookingLabel: string;   // 予約ボタンの文言
  address: string;
  stations: string[];
  rec: Plan[];
  extension: string;
  bestValue: { headline: string; note: string } | null;
  priceNote: string;      // 料金表の下の注記
};

export const INSTAGRAM_URL = "https://www.instagram.com/jfliponthegame/";

const STORE1_BOOKING =
  "https://book.squareup.com/appointments/atrhlg3x3adiil/location/LJFDVKXY7Y7PC/services";

/**
 * 2号店を公開するか。環境変数 NEXT_PUBLIC_STORE2_ENABLED=true のときだけオン。
 * 未設定（既定）なら、切り替えボタンも2号店の内容もHTML・JSに一切出ない。
 */
export const STORE2_ENABLED = process.env.NEXT_PUBLIC_STORE2_ENABLED === "true";

const STORE_1: Store = {
  id: "1",
  label: "1号店 練馬",
  name: "JFLIPSTUDIO 1号店",
  area: "練馬区豊玉北",
  hours: "13:00 – 23:00",
  closed: "日曜定休",
  bookingUrl: STORE1_BOOKING,
  bookingLabel: "WEBで予約する",
  address: "東京都練馬区豊玉北",
  stations: ["都営大江戸線「新江古田」駅 徒歩8分", "西武池袋線「江古田」駅 徒歩10分"],
  rec: [
    { name: "通常利用", detail: "2時間", hourly: "1h ¥5,500", price: "¥11,000" },
    { name: "3hパック", detail: "3時間", hourly: "1h ¥5,300", price: "¥15,900" },
    { name: "4hパック", detail: "4時間", hourly: "1h ¥5,150", price: "¥20,600" },
    { name: "5hパック", detail: "5時間", hourly: "1h ¥5,000", price: "¥25,000" },
    { name: "6hパック", detail: "6時間", hourly: "1h ¥4,850", price: "¥29,100" },
    { name: "10hパック", detail: "10時間", hourly: "1h ¥4,600 ★", price: "¥46,000" },
  ],
  extension: "15分 ¥1,400 / 30分 ¥2,700",
  priceNote: "※ 表示価格は全て税込・エンジニア込みの価格です。法人のお客様は別途お問い合わせください。",
  bestValue: {
    headline: "1時間あたり ¥4,600",
    note: "10hパック（¥46,000）ご利用時。エンジニア立ち合い込みで、この地域では最安水準の時間単価です。",
  },
};

/** 公開する店舗。2号店はフラグがオンのときだけ含める（オフのビルドでは参照ごとJSから消える） */
export const STORES = (STORE2_ENABLED
  ? { "1": STORE_1, "2": STORE_2 }
  : { "1": STORE_1 }) as Record<StoreId, Store>;
