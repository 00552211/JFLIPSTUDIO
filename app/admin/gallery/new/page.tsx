import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createGalleryImage } from "../_actions/save-image";

export default async function NewGalleryImagePage() {
  await requireAdminPage();

  return (
    <div className="mx-auto max-w-lg px-6 py-12 text-white">
      <div className="mb-8 flex items-center gap-4">
        <h1 className="text-xl font-bold">Gallery 画像 新規登録</h1>
        <Link href="/admin/gallery" className="text-xs text-neutral-400 hover:text-white">
          一覧へ戻る
        </Link>
      </div>

      <form action={createGalleryImage} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs tracking-widest text-neutral-400">画像ファイル</label>
          <input
            type="file"
            name="file"
            accept="image/*"
            required
            className="block w-full text-sm text-neutral-300 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-xs file:font-bold file:text-black file:hover:bg-neutral-200"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs tracking-widest text-neutral-400">altテキスト（任意）</label>
          <Input name="alt" placeholder="例: 防音ブースの内観" />
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-300">
          <input type="checkbox" name="isPublished" />
          公開する
        </label>

        <Button type="submit" className="rounded-full px-8 py-3">
          登録する
        </Button>
      </form>
    </div>
  );
}
