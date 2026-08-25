const TOKEN_URL = "https://accounts.spotify.com/api/token";

let cached: { token: string; expiresAt: number } | null = null;

/**
 * Client Credentials フロー。
 * ユーザー資格情報を使わない = 公開カタログの読み取り専用。
 * サーバー内のモジュールスコープに短期キャッシュする（実行環境が使い回す限り有効）。
 */
export async function getSpotifyToken(): Promise<string> {
  const now = Date.now();
  if (cached && cached.expiresAt > now + 30_000) return cached.token;

  const id = process.env.SPOTIFY_CLIENT_ID;
  const secret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!id || !secret) throw new Error("SPOTIFY_CLIENT_ID / SECRET が未設定です");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!res.ok) {
    cached = null;
    throw new Error(`Spotify token error: ${res.status}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cached = { token: json.access_token, expiresAt: now + json.expires_in * 1000 };
  return cached.token;
}
