const CAL_API = "https://www.googleapis.com/calendar/v3";

export type DayStatus = "open" | "few" | "full" | "closed";

/** 営業時間（JST）。この範囲の空き時間だけを数える */
const OPEN_HOUR = 13;
const CLOSE_HOUR = 23;
const BUSINESS_HOURS = CLOSE_HOUR - OPEN_HOUR; // 10h
const CLOSED_WEEKDAY = 0;                      // 日曜定休

type CalEvent = { start?: { dateTime?: string; date?: string }; end?: { dateTime?: string; date?: string } };
type EventsResponse = { items?: CalEvent[]; error?: { message?: string } };

/**
 * スタジオのGoogleカレンダー（公開設定）から予定を取得し、
 * 日付ごとの空き具合 ◎ / △ / × に変換する。
 * 予定のタイトルや詳細は一切外に出さず、使うのは開始・終了時刻のみ。
 */
export async function fetchAvailability(
  startAt: Date,
  endAt: Date,
): Promise<Record<string, DayStatus>> {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const apiKey = process.env.GOOGLE_CALENDAR_API_KEY;
  if (!calendarId || !apiKey) throw new Error("Googleカレンダーの環境変数が未設定です");

  const url = new URL(`${CAL_API}/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("timeMin", startAt.toISOString());
  url.searchParams.set("timeMax", endAt.toISOString());
  url.searchParams.set("singleEvents", "true");   // 繰り返しを展開
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "2500");
  url.searchParams.set("timeZone", "Asia/Tokyo");

  const res = await fetch(url, { next: { revalidate: 300 } });
  const json = (await res.json()) as EventsResponse;
  if (!res.ok) throw new Error(json.error?.message ?? `Calendar API ${res.status}`);

  // TEMP DEBUG: 実際の予定の時刻がどう解釈されているか確認するため一時的に出力
  console.log("[availability-debug]", JSON.stringify({
    calendarId,
    timeMin: startAt.toISOString(),
    timeMax: endAt.toISOString(),
    eventCount: (json.items ?? []).length,
    events: (json.items ?? []).map((ev) => ({ start: ev.start, end: ev.end })),
  }));

  // 日付ごとの「埋まっている時間数」を積算
  const busyHours: Record<string, number> = {};
  const allDay = new Set<string>();

  for (const ev of json.items ?? []) {
    if (ev.start?.date && ev.end?.date) {
      // 終日予定 → その日は×
      for (const d = new Date(`${ev.start.date}T00:00:00+09:00`); d < new Date(`${ev.end.date}T00:00:00+09:00`); d.setDate(d.getDate() + 1)) {
        allDay.add(jstKey(d));
      }
      continue;
    }
    if (!ev.start?.dateTime || !ev.end?.dateTime) continue;

    const s = new Date(ev.start.dateTime);
    const e = new Date(ev.end.dateTime);
    const key = jstKey(s);
    const hours = Math.max(0, (e.getTime() - s.getTime()) / 3_600_000);
    busyHours[key] = (busyHours[key] ?? 0) + Math.min(hours, BUSINESS_HOURS);
  }

  const out: Record<string, DayStatus> = {};
  for (const d = new Date(startAt); d <= endAt; d.setDate(d.getDate() + 1)) {
    const key = jstKey(d);
    if (weekdayOf(key) === CLOSED_WEEKDAY) { out[key] = "closed"; continue; }
    if (allDay.has(key)) { out[key] = "full"; continue; }

    const free = BUSINESS_HOURS - (busyHours[key] ?? 0);
    // 3時間未満しか空いていなければ×（最短利用が2〜3時間想定）
    out[key] = free >= BUSINESS_HOURS ? "open" : free >= 3 ? "few" : "full";
  }
  return out;
}

/** JSTの YYYY-MM-DD */
function jstKey(d: Date) {
  return d.toLocaleDateString("sv-SE", { timeZone: "Asia/Tokyo" });
}

/**
 * "YYYY-MM-DD"(JSTの暦日)の曜日を返す。d.getDay() はサーバーのタイムゾーン
 * (Vercelは基本UTC)で評価されるため、JST基準の日付とズレる場合がある
 * (例: JST 8/3 0:00 は UTC では 8/2 15:00 になり getDay() が前日の曜日を返す)。
 * "YYYY-MM-DD"をUTC 0時として解釈し直せばタイムゾーンに依存せず判定できる。
 */
function weekdayOf(jstDateKey: string): number {
  return new Date(`${jstDateKey}T00:00:00Z`).getUTCDay();
}
