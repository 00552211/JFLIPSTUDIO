const CAL_API = "https://www.googleapis.com/calendar/v3";

export type DayStatus = "open" | "few" | "full" | "closed";

/** 営業時間（JST）。この範囲の空き時間だけを数える */
const OPEN_HOUR = 13;
const CLOSE_HOUR = 23;
const CLOSED_WEEKDAY = 0;                      // 日曜定休

// 判定は「営業時間内で一番長く連続して空いている時間」を見る。
// 営業時間まるまる(10h)が条件だと予定が1件でもあれば絶対に open にならず
// 機能しないため、実利用（最短2〜3h想定）に沿った閾値にする。
const OPEN_THRESHOLD_HOURS = 7;  // これ以上連続で空いていれば「空きあり」
const FEW_THRESHOLD_HOURS = 3;   // これ以上なら「残りわずか」、未満なら「満席」

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

  // 日付ごとの busy 区間（実時刻）を集める。合計時間ではなく「営業時間内で
  // 一番長く連続して空いている時間」で判定するため、区間そのものを保持する。
  const busyIntervalsByDay: Record<string, { startMs: number; endMs: number }[]> = {};
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

    const startMs = new Date(ev.start.dateTime).getTime();
    const endMs = new Date(ev.end.dateTime).getTime();
    if (endMs <= startMs) continue;

    // 日をまたぐ予定もあるため、開始日・終了日の両方に登録しておく
    // （maxFreeBlockHours 側で当日の営業時間外にクリップされる）。
    const startKey = jstKey(new Date(startMs));
    const endKey = jstKey(new Date(endMs - 1));
    (busyIntervalsByDay[startKey] ??= []).push({ startMs, endMs });
    if (endKey !== startKey) {
      (busyIntervalsByDay[endKey] ??= []).push({ startMs, endMs });
    }
  }

  const out: Record<string, DayStatus> = {};
  for (const d = new Date(startAt); d <= endAt; d.setDate(d.getDate() + 1)) {
    const key = jstKey(d);
    if (weekdayOf(key) === CLOSED_WEEKDAY) { out[key] = "closed"; continue; }
    if (allDay.has(key)) { out[key] = "full"; continue; }

    const free = maxFreeBlockHours(key, busyIntervalsByDay[key] ?? []);
    out[key] = free >= OPEN_THRESHOLD_HOURS ? "open" : free >= FEW_THRESHOLD_HOURS ? "few" : "full";
  }
  return out;
}

/**
 * その日の営業時間(JST OPEN_HOUR〜CLOSE_HOUR)のうち、予定(busy区間)を
 * 差し引いた「一番長く連続して空いている時間」を時間単位で返す。
 * 単純な合計busy時間で判定すると、短い予定が1件あるだけでも即座に
 * 「空きなし」寄りの判定になってしまうため、連続区間で見る。
 */
function maxFreeBlockHours(
  dateKey: string,
  busyIntervals: { startMs: number; endMs: number }[],
): number {
  const dayStart = new Date(`${dateKey}T${String(OPEN_HOUR).padStart(2, "0")}:00:00+09:00`).getTime();
  const dayEnd = new Date(`${dateKey}T${String(CLOSE_HOUR).padStart(2, "0")}:00:00+09:00`).getTime();

  const clipped = busyIntervals
    .map(({ startMs, endMs }) => ({
      start: Math.max(startMs, dayStart),
      end: Math.min(endMs, dayEnd),
    }))
    .filter((iv) => iv.end > iv.start)
    .sort((a, b) => a.start - b.start);

  let cursor = dayStart;
  let maxFreeMs = 0;
  for (const iv of clipped) {
    if (iv.start > cursor) maxFreeMs = Math.max(maxFreeMs, iv.start - cursor);
    cursor = Math.max(cursor, iv.end);
  }
  maxFreeMs = Math.max(maxFreeMs, dayEnd - cursor);
  return maxFreeMs / 3_600_000;
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
