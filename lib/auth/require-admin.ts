import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** 管理者以外は例外。実際の防御は RLS 側でも二重にかける。 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("UNAUTHENTICATED");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") throw new Error("FORBIDDEN");
  return user;
}

/** ページ(Server Component)から使う版。未認証・非管理者はログイン画面へ飛ばす。 */
export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch {
    redirect("/admin/login");
  }
}
