"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { parseSpotifyRef, canonicalSpotifyUrl } from "@/lib/spotify/parse-url";
import { fetchSpotifyMetaByRef, SpotifyFetchError } from "@/lib/spotify/client";
import { saveJacketFromUrl } from "@/lib/spotify/jacket";

const spotifyPrefillSchema = z.object({
  spotifyTrackId: z.string(),
  spotifyUrl: z.string().url(),
  title: z.string().min(1),
  artist: z.string().min(1),
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  durationMs: z.number().int().positive().nullable(),
  jacketPath: z.string().nullable(),
  jacketPreviewUrl: z.string().url().nullable(),
});

type SpotifyPrefill = z.infer<typeof spotifyPrefillSchema>;

type FetchSpotifyMetaResult =
  | { ok: true; data: SpotifyPrefill }
  | { ok: false; code: "invalid_url" | "not_found" | "rate_limited" | "duplicate" | "unknown";
      message: string; existingWorkId?: string };

/**
 * 管理フォームから呼ぶ Server Action。
 * 資格情報はこの境界の内側だけで使い、クライアントには決して渡さない。
 */
export async function fetchSpotifyMeta(rawUrl: string): Promise<FetchSpotifyMetaResult> {
  await requireAdmin();

  const ref = parseSpotifyRef(rawUrl);
  if (!ref) {
    return {
      ok: false,
      code: "invalid_url",
      message: "URLを認識できませんでした。open.spotify.com の track / album のURLを貼ってください。",
    };
  }

  const supabase = await createClient();

  // 重複チェック: 既に登録済みなら編集画面へ誘導する
  const { data: existing } = await supabase
    .from("works")
    .select("id")
    .eq("spotify_track_id", ref.id)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      code: "duplicate",
      message: "このリンクは既に登録されています。既存のWorksを編集してください。",
      existingWorkId: existing.id,
    };
  }

  try {
    const meta = await fetchSpotifyMetaByRef(ref);
    const jacketPath = meta.imageUrl
      ? await saveJacketFromUrl(supabase, meta.imageUrl, meta.spotifyTrackId)
      : null;

    const previewUrl = jacketPath
      ? supabase.storage.from("works").getPublicUrl(jacketPath).data.publicUrl
      : meta.imageUrl;

    return {
      ok: true,
      data: spotifyPrefillSchema.parse({
        spotifyTrackId: meta.spotifyTrackId,
        spotifyUrl: meta.spotifyUrl || canonicalSpotifyUrl(ref),
        title: meta.title,
        artist: meta.artist,
        releaseDate: meta.releaseDate,
        durationMs: meta.durationMs,
        jacketPath,
        jacketPreviewUrl: previewUrl,
      }),
    };
  } catch (e) {
    if (e instanceof SpotifyFetchError) {
      if (e.code === "not_found") {
        return { ok: false, code: "not_found",
          message: "見つかりませんでした（非公開・地域制限の可能性）。手入力で続けられます。" };
      }
      if (e.code === "rate_limited") {
        return { ok: false, code: "rate_limited",
          message: `混み合っています。${e.retryAfterSec ?? 2}秒後にもう一度お試しください。` };
      }
    }
    console.error("[fetchSpotifyMeta]", e);
    return { ok: false, code: "unknown", message: "取得に失敗しました。手入力で続けられます。" };
  }
}
