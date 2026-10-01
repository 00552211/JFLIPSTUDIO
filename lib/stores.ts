// 店舗ごとの情報。1号店・2号店で内容が違うものはここに集約する。
// ※ 2号店の最寄り駅・定休日・お支払い方法は未確定のため、表示側で出し分けている。
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
};

export const INSTAGRAM_URL = "https://www.instagram.com/jfliponthegame/";

const STORE1_BOOKING =
  "https://book.squareup.com/appointments/atrhlg3x3adiil/location/LJFDVKXY7Y7PC/services";

// 2号店のSquare予約ページURL。未設定の間はInstagram DMへ誘導する。
const STORE2_BOOKING = process.env.NEXT_PUBLIC_STORE2_BOOKING_URL || INSTAGRAM_URL;

const store2Plan = (hours: number, price: number): Plan => ({
  name: `${hours}時間`,
  detail: "エンジニア込み",
  hourly: `1h ¥${Math.round(price / hours).toLocaleString("ja-JP")}`,
  price: `¥${price.toLocaleString("ja-JP")}`,
});

export const STORES: Record<StoreId, Store> = {
  "1": {
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
    bestValue: {
      headline: "1時間あたり ¥4,600",
      note: "10hパック（¥46,000）ご利用時。エンジニア立ち合い込みで、この地域では最安水準の時間単価です。",
    },
  },
  "2": {
    id: "2",
    label: "2号店 東長崎",
    name: "JFLIPSTUDIO 2号店",
    area: "豊島区東長崎",
    hours: "10:00 – 23:00",
    closed: null,
    bookingUrl: STORE2_BOOKING,
    bookingLabel: process.env.NEXT_PUBLIC_STORE2_BOOKING_URL ? "WEBで予約する" : "Instagram DMで予約する",
    address: "東京都豊島区東長崎",
    stations: [],
    rec: [
      store2Plan(1, 4500),
      store2Plan(1.5, 6500),
      store2Plan(2, 9000),
      store2Plan(2.5, 11000),
      store2Plan(3, 12000),
      store2Plan(3.5, 14000),
      store2Plan(4, 16000),
      store2Plan(4.5, 18000),
      store2Plan(5, 20000),
      store2Plan(5.5, 22000),
      store2Plan(6, 24000),
    ],
    extension: "15分 ¥1,200",
    bestValue: {
      headline: "1時間あたり ¥4,000",
      note: "3時間以上のご利用時。エンジニア（IKUTO）付き、REC・MIX・MASTER すべて込みの料金です。",
    },
  },
};

export const STORE2_ENGINEER = {
  name: "IKUTO（イクト）",
  bio: "2004年生まれ、埼玉県出身。ソングライター / 作編曲家 / トラックメーカー / ミックスエンジニア。J-POP、Hip-Hop、R&Bを軸に、Hey! Say! JUMP、ONE N' ONLYをはじめとするアーティストへの楽曲提供や、VTuber・ドラマ劇伴など幅広いジャンルの作品制作に参加。",
};

export const STORE2_GEAR = [
  { label: "AUDIO INTERFACE", name: "Apollo Twin X Duo" },
  { label: "MICROPHONE", name: "Audio-Technica AT4050 / AKG C414 XLS" },
  { label: "MONITOR SPEAKERS", name: "YAMAHA HS5" },
  { label: "HEADPHONES", name: "SONY MDR-7506 ×3 / Audio-Technica ATH-M50x（エンジニア用）" },
  { label: "OTHERS", name: "TEDMAN Proscreen XL V2 / Big Knob Passive / Halo Shadow / MIX5" },
];
