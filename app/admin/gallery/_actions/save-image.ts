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
