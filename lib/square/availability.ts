const SQUARE_API = process.env.SQUARE_ENV === "sandbox"
  ? "https://connect.squareupsandbox.com"
  : "https://connect.squareup.com";

export type DayStatus = "open" | "few" | "full" | "closed";

/** 1日あたりの空き枠数から ◎ / △ / × を決める閾値 */
const FEW_THRESHOLD = 3;

type SearchAvailabilityResponse = {
  availabilities?: { start_at: string }[];
  errors?: { detail?: string }[];
};

/** 2号店のSquareアカウント。トークン類はサーバー側の環境変数のみ（NEXT_PUBLIC_ を付けない） */
const STORE2_CLOSED_WEEKDAY: number | null = null; // 2号店の定休日は未確定

/**
 * 2号店のSquare Bookingsから空き枠を取得し、日付ごとに ◎ / △ / × へ集計する。
 * 空き枠の検索には最短プラン（60分）のサービスバリエーションIDを使う。
 */
export async function fetchStore2Availability(
  startAt: Date,
  endAt: Date,
): Promise<Record<string, DayStatus>> {
  const token = process.env.SQUARE2_ACCESS_TOKEN;
  const locationId = process.env.SQUARE2_LOCATION_ID;
  const serviceVariationId = process.env.SQUARE2_SERVICE_VARIATION_ID;
  if (!token || !locationId || !serviceVariationId) {
    throw new Error("2号店のSquare環境変数が未設定です");
  }

  // Square は過去日を start_at に指定すると拒否するため、startAt が過去なら現在時刻を起点にする
  const queryStart = startAt < new Date() ? new Date() : startAt;
  if (queryStart > endAt) return {};

  const res = await fetch(`${SQUARE_API}/v2/bookings/availability/search`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Square-Version": "2024-10-17",
    },
    body: JSON.stringify({
      query: {
        filter: {
          start_at_range: { start_at: queryStart.toISOString(), end_at: endAt.toISOString() },
          location_id: locationId,
          segment_filters: [{ service_variation_id: serviceVariationId }],
        },
      },
    }),
    next: { revalidate: 300 },
  });

  const json = (await res.json()) as SearchAvailabilityResponse;
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.detail ?? `Square API ${res.status}`);
  }

  // 日付(JST)ごとに枠数を数える
  const counts: Record<string, number> = {};
  for (const a of json.availabilities ?? []) {
    const key = jstKey(new Date(a.start_at));
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const out: Record<string, DayStatus> = {};
  for (const d = new Date(startAt); d <= endAt; d.setDate(d.getDate() + 1)) {
    const key = jstKey(d);
    if (STORE2_CLOSED_WEEKDAY !== null && weekdayOf(key) === STORE2_CLOSED_WEEKDAY) {
      out[key] = "closed";
      continue;
    }
    const n = counts[key] ?? 0;
    out[key] = n === 0 ? "full" : n <= FEW_THRESHOLD ? "few" : "open";
  }
  return out;
}

/** JSTの YYYY-MM-DD */
function jstKey(d: Date) {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/** "YYYY-MM-DD"(JSTの暦日)の曜日。サーバーのタイムゾーンに依存しない */
function weekdayOf(jstDateKey: string): number {
  return new Date(`${jstDateKey}T00:00:00Z`).getUTCDay();
}
