"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

const BUCKET = "gallery";
const MAX_SIZE = 8 * 1024 * 1024; // 8MB

export async function createGalleryImage(formData: FormData) {
  await requireAdmin();

  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "");
  const isPublished = formData.get("isPublished") === "on";

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("画像を選択してください");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("画像サイズは8MB以下にしてください");
  }

  const supabase = await createClient();
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `photos/${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, await file.arrayBuffer(), { contentType: file.type || "image/jpeg" });
  if (uploadError) throw new Error(uploadError.message);

  const { error } = await supabase
    .from("gallery_images")
    .insert({ image_path: path, alt, is_published: isPublished });
  if (error) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw new Error(error.message);
  }

  revalidatePath("/admin/gallery");
  revalidatePath("/");
  redirect("/admin/gallery");
}

const STATIC_GALLERY_COUNT = 8;
const SITE_URL = "https://jflipstudio.com";

/**
 * 公開ページに元々埋め込まれていた photo-01〜08.jpg を Storage + DB に取り込む。
 * 画像パスを photos/static-01.jpg のように固定し、DB に既に同じパスがあれば
 * その番号だけスキップする（冪等 = 何度実行しても安全、途中失敗分だけ再取得できる）。
 * 8枚を直列でfetch+uploadすると合計時間がサーバーレス関数のタイムアウトに
 * 近づき得るため、並列に取りに行く。
 */
export async function importStaticGallery() {
  await requireAdmin();
  const supabase = await createClient();

  const results = await Promise.all(
    Array.from({ length: STATIC_GALLERY_COUNT }, (_, i) => i + 1).map(async (n) => {
      const path = `photos/static-${String(n).padStart(2, "0")}.jpg`;

      const { data: existing } = await supabase
        .from("gallery_images")
        .select("id")
        .eq("image_path", path)
        .maybeSingle();
      if (existing) return "skipped" as const;

      const filename = `photo-${String(n).padStart(2, "0")}.jpg`;
      try {
        const res = await fetch(`${SITE_URL}/assets/${filename}`, { cache: "no-store" });
        if (!res.ok) return "failed" as const;

        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, await res.arrayBuffer(), { contentType: "image/jpeg", upsert: true });
        if (uploadError) return "failed" as const;

        const { error } = await supabase
          .from("gallery_images")
          .insert({ image_path: path, alt: "", is_published: true, sort_order: n * 10 });
        if (error) {
          await supabase.storage.from(BUCKET).remove([path]);
          return "failed" as const;
        }
        return "imported" as const;
      } catch {
        return "failed" as const;
      }
    }),
  );

  const imported = results.filter((r) => r === "imported").length;
  const failed = results.filter((r) => r === "failed").length;

  revalidatePath("/admin/gallery");
  revalidatePath("/");

  if (imported === 0 && failed === 0) {
    throw new Error("すでにすべて取り込み済みです");
  }
  if (imported === 0) {
    throw new Error("画像を取り込めませんでした。もう一度お試しください");
  }
  if (failed > 0) {
    throw new Error(`${imported}枚取り込みました（${failed}枚は失敗したので、もう一度ボタンを押すと再試行できます）`);
  }
}

export async function updateGalleryImageAlt(id: string, alt: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_images")
    .update({ alt })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/gallery");
  revalidatePath("/");
}

export async function deleteGalleryImage(id: string, imagePath: string) {
  await requireAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("gallery_images").delete().eq("id", id);
  if (error) throw new Error(error.message);

  await supabase.storage.from(BUCKET).remove([imagePath]);

  revalidatePath("/admin/gallery");
  revalidatePath("/");
}

export async function setGalleryImagePublished(id: string, isPublished: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("gallery_images")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/gallery");
  revalidatePath("/");
}
