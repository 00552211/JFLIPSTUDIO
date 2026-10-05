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
    { name: "1時間", detail: "エンジニア込み", hourly: "1h ¥5,500", price: "¥5,500" },
    { name: "1.5時間", detail: "エンジニア込み", hourly: "1h ¥5,500", price: "¥8,250" },
    { name: "2時間", detail: "エンジニア込み", hourly: "1h ¥5,500", price: "¥11,000" },
    { name: "2.5時間", detail: "エンジニア込み", hourly: "1h ¥5,500", price: "¥13,750" },
    { name: "3時間", detail: "エンジニア込み", hourly: "1h ¥5,000", price: "¥15,000" },
    { name: "3.5時間", detail: "エンジニア込み", hourly: "1h ¥5,000", price: "¥17,500" },
    { name: "4時間", detail: "エンジニア込み", hourly: "1h ¥5,000", price: "¥20,000" },
    { name: "4.5時間", detail: "エンジニア込み", hourly: "1h ¥5,000", price: "¥22,500" },
    { name: "5時間", detail: "エンジニア込み", hourly: "1h ¥5,000", price: "¥25,000" },
  ],
  extension: "15分 ¥1,400",
  priceNote: "※ 表示価格は全て税込・エンジニア込みの価格です。法人のお客様は別途お問い合わせください。",
  bestValue: {
    headline: "1時間あたり ¥5,000",
    note: "3時間以上のご利用時（30分単位で選択可）。エンジニア立ち合い込み、REC・MIX・MASTER すべて込みの料金です。",
  },
};

/** 公開する店舗。2号店はフラグがオンのときだけ含める（オフのビルドでは参照ごとJSから消える） */
export const STORES = (STORE2_ENABLED
  ? { "1": STORE_1, "2": STORE_2 }
  : { "1": STORE_1 }) as Record<StoreId, Store>;
