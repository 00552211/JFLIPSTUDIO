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
 * すでに1件でも登録済みなら重複登録を避けるため何もしない。
 */
export async function importStaticGallery() {
  await requireAdmin();
  const supabase = await createClient();

  const { count } = await supabase
    .from("gallery_images")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) {
    throw new Error("すでに画像が登録されているため、取り込みをスキップしました");
  }

  let imported = 0;
  for (let n = 1; n <= STATIC_GALLERY_COUNT; n++) {
    const filename = `photo-${String(n).padStart(2, "0")}.jpg`;
    const res = await fetch(`${SITE_URL}/assets/${filename}`, { cache: "no-store" });
    if (!res.ok) continue;

    const path = `photos/${crypto.randomUUID()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, await res.arrayBuffer(), { contentType: "image/jpeg" });
    if (uploadError) continue;

    const { error } = await supabase
      .from("gallery_images")
      .insert({ image_path: path, alt: "", is_published: true, sort_order: n * 10 });
    if (error) {
      await supabase.storage.from(BUCKET).remove([path]);
      continue;
    }
    imported++;
  }

  if (imported === 0) throw new Error("画像を取り込めませんでした");

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
