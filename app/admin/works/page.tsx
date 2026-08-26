import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../_actions/sign-out";
import { WorksList } from "./works-list";

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

      <p className="mb-4 text-xs text-neutral-500">⠿ をドラッグすると並び順を変更できます。並び順はトップページのWORKS表示順に反映されます。</p>
      <WorksList initialWorks={works ?? []} />
    </div>
  );
}
