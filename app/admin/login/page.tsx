"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setPending(false);
    if (signInError) {
      setError("ログインに失敗しました。メールアドレスとパスワードを確認してください。");
      return;
    }
    router.push("/admin/works");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a] text-white">
      <form onSubmit={onSubmit} className="w-80 space-y-4">
        <h1 className="mb-2 text-lg font-bold">管理者ログイン</h1>
        <Input
          type="email"
          required
          placeholder="メールアドレス"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          type="password"
          required
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <Button type="submit" disabled={pending} className="w-full rounded-full py-3">
          {pending ? "ログイン中…" : "ログイン"}
        </Button>
      </form>
    </div>
  );
}
