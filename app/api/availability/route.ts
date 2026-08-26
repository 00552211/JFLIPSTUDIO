import { NextResponse } from "next/server";
import { fetchAvailability } from "@/lib/google/availability";

export const revalidate = 300;

/**
 * 公開エンドポイント。返すのは日付 → ◎/△/× のみ。
 * 予約者情報やトークンは一切クライアントに出さない。
 */
export async function GET(request: Request) {
  const monthParam = new URL(request.url).searchParams.get("month"); // YYYY-MM
  const match = monthParam?.match(/^(\d{4})-(\d{2})$/);

  // サーバーのタイムゾーン(Vercelは基本UTC)で年月を取り出すと、JST基準の月初と
  // ズレる(例: JST 8/1 0:00 は UTC では 7/31 15:00 になり getMonth() が7月を返す)。
  // 年月は文字列のまま扱い、Dateへの変換は「YYYY-MM-01T00:00:00+09:00」の形だけで行う。
  let year: number;
  let month: number; // 1-indexed
  if (match) {
    year = Number(match[1]);
    month = Number(match[2]);
  } else {
    const [y, m] = new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" }).split("-");
    year = Number(y);
    month = Number(m);
  }
  if (month < 1 || month > 12) {
    return NextResponse.json({ error: "invalid month" }, { status: 400 });
  }

  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;

  const start = new Date(`${year}-${String(month).padStart(2, "0")}-01T00:00:00+09:00`);
  const end = new Date(new Date(`${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00+09:00`).getTime() - 1);

  try {
    const days = await fetchAvailability(start, end);
    return NextResponse.json({ ok: true, days });
  } catch (e) {
    console.error("[availability]", e);
    // 失敗時はサイト側で「目安表示」にフォールバックさせる
    return NextResponse.json({ ok: false, days: {} }, { status: 200 });
  }
}
