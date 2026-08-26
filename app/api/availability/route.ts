import { NextResponse } from "next/server";
import { fetchAvailability } from "@/lib/square/availability";

export const revalidate = 300;

/**
 * 公開エンドポイント。返すのは日付 → ◎/△/× のみ。
 * 予約者情報やトークンは一切クライアントに出さない。
 */
export async function GET(request: Request) {
  const monthParam = new URL(request.url).searchParams.get("month"); // YYYY-MM
  const base = monthParam ? new Date(`${monthParam}-01T00:00:00+09:00`) : new Date();
  if (Number.isNaN(base.getTime())) {
    return NextResponse.json({ error: "invalid month" }, { status: 400 });
  }

  const start = new Date(base.getFullYear(), base.getMonth(), 1);
  const end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 23, 59, 59);

  try {
    const days = await fetchAvailability(start, end);
    return NextResponse.json({ ok: true, days });
  } catch (e) {
    console.error("[availability]", e);
    // 失敗時はサイト側で「目安表示」にフォールバックさせる
    return NextResponse.json({ ok: false, days: {} }, { status: 200 });
  }
}
