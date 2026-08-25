import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "works";

/**
 * Spotify のアートワークを取得して Supabase Storage に保存し、パスを返す。
 * 外部URLを直参照しない理由: Spotify側のCDN URLは失効しうる & 規約上のキャッシュ扱いを自前で管理したいため。
 */
export async function saveJacketFromUrl(
  supabase: SupabaseClient,
  imageUrl: string,
  key: string,
): Promise<string | null> {
  const res = await fetch(imageUrl, { cache: "no-store" });
  if (!res.ok) return null;

  const type = res.headers.get("content-type") ?? "image/jpeg";
  const ext = type.includes("png") ? "png" : "jpg";
  const path = `jackets/${key}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, await res.arrayBuffer(), { contentType: type, upsert: true });

  if (error) return null;
  return path;
}
