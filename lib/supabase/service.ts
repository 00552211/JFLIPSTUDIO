import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * サービスロールキーを使うサーバー専用クライアント。RLSを無視して読み書きする。
 * Webhookなどユーザーセッション（cookie）を持たないサーバー間処理でのみ使うこと。
 * 絶対にクライアントコンポーネントやAPIレスポンスに鍵を露出させない。
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("Supabase service role env vars are not set");
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
