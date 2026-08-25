export type SpotifyRefType = "track" | "album";

export type SpotifyRef = { type: SpotifyRefType; id: string };

const ID = /^[A-Za-z0-9]{22}$/;

/**
 * 受け付ける形式:
 *   https://open.spotify.com/track/xxxx?si=...
 *   https://open.spotify.com/intl-ja/album/xxxx
 *   spotify:track:xxxx
 *   xxxx (22文字のID単体 → track扱い)
 */
export function parseSpotifyRef(input: string): SpotifyRef | null {
  const raw = input.trim();
  if (!raw) return null;

  if (ID.test(raw)) return { type: "track", id: raw };

  const uri = raw.match(/^spotify:(track|album):([A-Za-z0-9]{22})$/);
  if (uri) return { type: uri[1] as SpotifyRefType, id: uri[2] };

  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  if (!/(^|\.)spotify\.com$/.test(url.hostname)) return null;

  // /track/xx, /intl-ja/track/xx, /embed/track/xx すべて拾う
  const seg = url.pathname.split("/").filter(Boolean);
  const i = seg.findIndex((s) => s === "track" || s === "album");
  if (i === -1) return null;
  const id = seg[i + 1];
  if (!id || !ID.test(id)) return null;

  return { type: seg[i] as SpotifyRefType, id };
}

/** 保存用の正規化URL（si= などのトラッキングを落とす） */
export function canonicalSpotifyUrl(ref: SpotifyRef): string {
  return `https://open.spotify.com/${ref.type}/${ref.id}`;
}
