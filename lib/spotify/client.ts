import { getSpotifyToken } from "./token";
import { canonicalSpotifyUrl, type SpotifyRef } from "./parse-url";

const API = "https://api.spotify.com/v1";

export type SpotifyMeta = {
  spotifyTrackId: string;
  spotifyUrl: string;
  title: string;
  /** artists を ", " で連結（feat. 表記は管理側で手直しする前提） */
  artist: string;
  artistNames: string[];
  /** YYYY-MM-DD に正規化（Spotifyは年のみ/年月のこともある） */
  releaseDate: string | null;
  durationMs: number | null;
  /** 最大サイズのアートワークURL（そのまま表示せず Storage に保存する） */
  imageUrl: string | null;
};

export class SpotifyFetchError extends Error {
  constructor(
    public code: "not_found" | "rate_limited" | "unauthorized" | "upstream",
    message: string,
    public retryAfterSec?: number,
  ) {
    super(message);
  }
}

async function api<T>(path: string): Promise<T> {
  const token = await getSpotifyToken();
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    // 同じIDへの短時間の連打だけ吸収する
    next: { revalidate: 3600 },
  });

  if (res.status === 404) throw new SpotifyFetchError("not_found", "見つかりませんでした");
  if (res.status === 401) throw new SpotifyFetchError("unauthorized", "認証に失敗しました");
  if (res.status === 429) {
    const retry = Number(res.headers.get("retry-after") ?? "2");
    throw new SpotifyFetchError("rate_limited", "混み合っています", retry);
  }
  if (!res.ok) throw new SpotifyFetchError("upstream", `Spotify API ${res.status}`);

  return (await res.json()) as T;
}

function normalizeDate(date?: string, precision?: string): string | null {
  if (!date) return null;
  if (precision === "year") return `${date}-01-01`;
  if (precision === "month") return `${date}-01`;
  return date;
}

type Img = { url: string; width: number | null };
type ApiArtist = { name: string };
type ApiAlbum = {
  id: string;
  name: string;
  artists: ApiArtist[];
  images: Img[];
  release_date?: string;
  release_date_precision?: string;
  external_urls: { spotify: string };
};
type ApiTrack = {
  id: string;
  name: string;
  artists: ApiArtist[];
  duration_ms: number;
  album: ApiAlbum;
  external_urls: { spotify: string };
};

function pickImage(images: Img[]): string | null {
  if (!images?.length) return null;
  return [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0].url;
}

/** track / album どちらのURLでも同じ形に揃えて返す */
export async function fetchSpotifyMetaByRef(ref: SpotifyRef): Promise<SpotifyMeta> {
  if (ref.type === "album") {
    const al = await api<ApiAlbum>(`/albums/${ref.id}`);
    const names = al.artists.map((a) => a.name);
    return {
      spotifyTrackId: al.id,
      spotifyUrl: al.external_urls?.spotify ?? canonicalSpotifyUrl(ref),
      title: al.name,
      artist: names.join(", "),
      artistNames: names,
      releaseDate: normalizeDate(al.release_date, al.release_date_precision),
      durationMs: null,
      imageUrl: pickImage(al.images),
    };
  }

  const tr = await api<ApiTrack>(`/tracks/${ref.id}`);
  const names = tr.artists.map((a) => a.name);
  return {
    spotifyTrackId: tr.id,
    spotifyUrl: tr.external_urls?.spotify ?? canonicalSpotifyUrl(ref),
    title: tr.name,
    artist: names.join(", "),
    artistNames: names,
    releaseDate: normalizeDate(tr.album?.release_date, tr.album?.release_date_precision),
    durationMs: tr.duration_ms ?? null,
    imageUrl: pickImage(tr.album?.images ?? []),
  };
}
