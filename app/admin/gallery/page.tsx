import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { deleteGalleryImage, setGalleryImagePublished } from "./_actions/save-image";
import { signOut } from "../_actions/sign-out";

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

      <div className="flex flex-col gap-2">
        {withUrls.map((img) => (
          <div
            key={img.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 px-4 py-3"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={img.alt} className="size-14 rounded object-cover" />
            <span className="flex-1 text-sm text-neutral-300">{img.alt || "（altテキストなし）"}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                img.is_published ? "bg-emerald-600/80" : "bg-neutral-700"
              }`}
            >
              {img.is_published ? "公開中" : "下書き"}
            </span>
            <form action={setGalleryImagePublished.bind(null, img.id, !img.is_published)}>
              <button type="submit" className="text-xs text-neutral-300 hover:text-white">
                {img.is_published ? "非公開にする" : "公開する"}
              </button>
            </form>
            <form action={deleteGalleryImage.bind(null, img.id, img.image_path)}>
              <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                削除
              </button>
            </form>
          </div>
        ))}
        {withUrls.length === 0 && (
          <p className="text-sm text-neutral-500">まだ登録がありません。</p>
        )}
      </div>
    </div>
  );
}
