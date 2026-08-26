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

/**
 * Square Bookings の空き枠を日付ごとに集計する。
 * トークンはサーバー側の環境変数のみから読む（クライアントへ渡さない）。
 */
export async function fetchAvailability(
  startAt: Date,
  endAt: Date,
): Promise<Record<string, DayStatus>> {
  const token = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const serviceVariationId = process.env.SQUARE_SERVICE_VARIATION_ID;
  if (!token || !locationId || !serviceVariationId) {
    throw new Error("Square の環境変数が未設定です");
  }

  // Square は過去日を start_at に指定すると拒否するため、今月表示など startAt が
  // 過去になるケースは現在時刻を起点にする（出力の日付ループ側は startAt のまま）。
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
    // 空き状況は動くので短めのキャッシュ
    next: { revalidate: 300 },
  });

  const json = (await res.json()) as SearchAvailabilityResponse;
  if (!res.ok) {
    throw new Error(json.errors?.[0]?.detail ?? `Square API ${res.status}`);
  }

  // 日付(JST)ごとに枠数を数える
  const counts: Record<string, number> = {};
  for (const a of json.availabilities ?? []) {
    const key = new Date(a.start_at).toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    counts[key] = (counts[key] ?? 0) + 1;
  }

  const out: Record<string, DayStatus> = {};
  for (const d = new Date(startAt); d <= endAt; d.setDate(d.getDate() + 1)) {
    const key = d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
    if (d.getDay() === 0) { out[key] = "closed"; continue; }   // 日曜定休
    const n = counts[key] ?? 0;
    out[key] = n === 0 ? "full" : n <= FEW_THRESHOLD ? "few" : "open";
  }
  return out;
}
