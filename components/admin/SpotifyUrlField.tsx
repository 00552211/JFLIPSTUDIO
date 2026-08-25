"use client";

import { useState, useTransition } from "react";
import { useFormContext } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchSpotifyMeta } from "@/app/admin/works/_actions/fetch-spotify-meta";

export function SpotifyUrlField() {
  const form = useFormContext();
  const [pending, start] = useTransition();
  const [fetched, setFetched] = useState<{ jacket: string | null; date: string | null } | null>(null);

  const run = (url: string) => {
    if (!url.trim()) return;
    start(async () => {
      const res = await fetchSpotifyMeta(url);

      if (!res.ok) {
        // 失敗しても入力は続行できる（自動入力はあくまで補助）
        form.setError("spotifyUrl", { message: res.message });
        if (res.code === "duplicate" && res.existingWorkId) {
          toast.error(res.message, {
            action: { label: "編集を開く", onClick: () => location.assign(`/admin/works/${res.existingWorkId}/edit`) },
          });
        } else {
          toast.error(res.message);
        }
        return;
      }

      const d = res.data;
      form.clearErrors("spotifyUrl");
      // 既に手入力がある欄は尊重し、空欄だけ埋める
      const fill = (name: string, value: unknown) => {
        const cur = form.getValues(name);
        if (cur === undefined || cur === null || cur === "") form.setValue(name, value, { shouldDirty: true });
      };
      form.setValue("spotifyUrl", d.spotifyUrl, { shouldDirty: true });
      form.setValue("spotifyTrackId", d.spotifyTrackId);
      fill("title", d.title);
      fill("artist", d.artist);
      fill("releaseDate", d.releaseDate ?? "");
      fill("durationMs", d.durationMs);
      fill("jacketPath", d.jacketPath);

      setFetched({ jacket: d.jacketPreviewUrl, date: d.releaseDate });
      toast.success("Spotifyから取得しました。内容を確認してください。");
    });
  };

  return (
    <div className="space-y-2">
      <label className="text-xs tracking-widest text-neutral-400">SPOTIFY URL</label>
      <div className="flex gap-2">
        <Input
          placeholder="https://open.spotify.com/track/..."
          disabled={pending}
          {...form.register("spotifyUrl")}
          onPaste={(e) => {
            const text = e.clipboardData.getData("text");
            // 貼り付け直後に自動取得
            setTimeout(() => run(text), 0);
          }}
        />
        <Button type="button" onClick={() => run(form.getValues("spotifyUrl"))} disabled={pending}>
          {pending ? "取得中…" : "取得"}
        </Button>
      </div>

      {fetched && (
        <div className="flex items-start gap-3 rounded-md border border-neutral-800 bg-neutral-900/60 p-3">
          {fetched.jacket && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fetched.jacket} alt="" className="size-16 rounded object-cover" />
          )}
          <p className="text-xs leading-relaxed text-neutral-400">
            タイトル・アーティスト・ジャケットを自動入力しました。<br />
            表記は下のフォームで自由に上書きできます。
          </p>
        </div>
      )}

      <p className="text-xs text-neutral-500">
        クレジットは自動取得できないため手入力してください。
      </p>
    </div>
  );
}
