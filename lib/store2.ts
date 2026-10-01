import type { Store } from "./stores";

// 2号店（東長崎）。NEXT_PUBLIC_STORE2_ENABLED=true のときだけサイトに出る（lib/stores.ts を参照）。
// 関数呼び出しを含まないリテラルだけにして、オフのビルドではクライアントのJSから確実に消えるようにしている。
const INSTAGRAM_URL = "https://www.instagram.com/jfliponthegame/";
const BOOKING = process.env.NEXT_PUBLIC_STORE2_BOOKING_URL;

export const STORE_2: Store = {
    id: "2",
    label: "2号店 東長崎",
    name: "JFLIPSTUDIO 2号店",
    area: "豊島区東長崎",
    hours: "10:00 – 23:00",
    closed: null,
    bookingUrl: BOOKING || INSTAGRAM_URL,
    bookingLabel: BOOKING ? "WEBで予約する" : "Instagram DMで予約する",
    address: "東京都豊島区東長崎",
    stations: [],
    rec: [
      { name: "1時間", detail: "エンジニア込み", hourly: "1h ¥4,500", price: "¥4,500" },
      { name: "1.5時間", detail: "エンジニア込み", hourly: "1h ¥4,333", price: "¥6,500" },
      { name: "2時間", detail: "エンジニア込み", hourly: "1h ¥4,500", price: "¥9,000" },
      { name: "2.5時間", detail: "エンジニア込み", hourly: "1h ¥4,400", price: "¥11,000" },
      { name: "3時間", detail: "エンジニア込み", hourly: "1h ¥4,000", price: "¥12,000" },
      { name: "3.5時間", detail: "エンジニア込み", hourly: "1h ¥4,000", price: "¥14,000" },
      { name: "4時間", detail: "エンジニア込み", hourly: "1h ¥4,000", price: "¥16,000" },
      { name: "4.5時間", detail: "エンジニア込み", hourly: "1h ¥4,000", price: "¥18,000" },
      { name: "5時間", detail: "エンジニア込み", hourly: "1h ¥4,000", price: "¥20,000" },
      { name: "5.5時間", detail: "エンジニア込み", hourly: "1h ¥4,000", price: "¥22,000" },
      { name: "6時間", detail: "エンジニア込み", hourly: "1h ¥4,000", price: "¥24,000" },
    ],
    extension: "15分 ¥1,200",
    priceNote: "※ エンジニア（IKUTO）付き、REC・MIX・MASTER すべて込みの料金です。",
    bestValue: {
      headline: "1時間あたり ¥4,000",
      note: "3時間以上のご利用時。エンジニア（IKUTO）付き、REC・MIX・MASTER すべて込みの料金です。",
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
