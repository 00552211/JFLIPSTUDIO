import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../_actions/sign-out";
import { GalleryList } from "./gallery-list";

export default async function AdminGalleryPage() {
  await requireAdminPage();
  const supabase = await createClient();
  const { data: images } = await supabase
    .from("gallery_images")
    .select("id,image_path,alt,is_published,sort_order")
    .order("sort_order", { ascending: true });

  const withUrls = (images ?? []).map((img) => ({
    ...img,
    url: supabase.storage.from("gallery").getPublicUrl(img.image_path as string).data.publicUrl,
  }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-white">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Gallery 管理</h1>
          <Link href="/admin/works" className="text-xs text-neutral-400 hover:text-white">
            Works 管理へ
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/gallery/new"
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200"
          >
            + 新規登録
          </Link>
          <form action={signOut}>
            <button type="submit" className="text-xs text-neutral-400 hover:text-white">
              ログアウト
            </button>
          </form>
        </div>
      </div>

      <p className="mb-4 text-xs text-neutral-500">
        説明文はホームページのギャラリーにもキャプションとして表示されます。
      </p>
      <GalleryList initialImages={withUrls} />
    </div>
  );
}
