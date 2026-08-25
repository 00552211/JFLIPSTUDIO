import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { deleteWork, setWorkPublished } from "./_actions/save-work";
import { signOut } from "../_actions/sign-out";

export default async function AdminWorksPage() {
  await requireAdminPage();
  const supabase = await createClient();
  const { data: works } = await supabase
    .from("works")
    .select("id,title,artist,roles,is_published,sort_order")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 text-white">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-xl font-bold">Works 管理</h1>
        <div className="flex items-center gap-4">
          <Link
            href="/admin/works/new"
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
        {(works ?? []).map((w) => (
          <div
            key={w.id}
            className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 px-4 py-3"
          >
            <span className="flex-1 text-sm">
              {w.title} <span className="text-neutral-400">— {w.artist}</span>
            </span>
            <span className="text-xs text-neutral-500">{(w.roles ?? []).join(" / ")}</span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                w.is_published ? "bg-emerald-600/80" : "bg-neutral-700"
              }`}
            >
              {w.is_published ? "公開中" : "下書き"}
            </span>
            <Link href={`/admin/works/${w.id}/edit`} className="text-xs underline">
              編集
            </Link>
            <form action={setWorkPublished.bind(null, w.id, !w.is_published)}>
              <button type="submit" className="text-xs text-neutral-300 hover:text-white">
                {w.is_published ? "非公開にする" : "公開する"}
              </button>
            </form>
            <form action={deleteWork.bind(null, w.id)}>
              <button type="submit" className="text-xs text-red-400 hover:text-red-300">
                削除
              </button>
            </form>
          </div>
        ))}
        {(!works || works.length === 0) && (
          <p className="text-sm text-neutral-500">まだ登録がありません。</p>
        )}
      </div>
    </div>
  );
}
