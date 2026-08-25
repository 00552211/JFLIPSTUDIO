"use client";

import { useState, useTransition } from "react";
import { useForm, FormProvider, useFieldArray } from "react-hook-form";
import { SpotifyUrlField } from "@/components/admin/SpotifyUrlField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { WorkFormValues } from "./_actions/save-work";

const ROLE_OPTIONS = ["REC", "MIX", "MASTER"] as const;
const PLATFORM_OPTIONS = ["spotify", "apple_music", "youtube", "x", "other"] as const;

type Props = {
  defaultValues?: Partial<WorkFormValues>;
  onSubmitAction: (values: WorkFormValues) => Promise<void>;
  submitLabel: string;
};

export function WorkForm({ defaultValues, onSubmitAction, submitLabel }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<WorkFormValues>({
    defaultValues: {
      title: "",
      artist: "",
      roles: [],
      releaseDate: "",
      spotifyTrackId: null,
      spotifyUrl: "",
      durationMs: null,
      jacketPath: null,
      isPublished: false,
      credits: [],
      links: [],
      ...defaultValues,
    },
  });

  const credits = useFieldArray({ control: form.control, name: "credits" });
  const links = useFieldArray({ control: form.control, name: "links" });

  const onSubmit = form.handleSubmit((values) => {
    setError(null);
    startTransition(async () => {
      try {
        await onSubmitAction(values);
      } catch (e) {
        // redirect() から投げられる内部エラーはここに来ないので、実際の失敗のみ表示する
        setError(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} className="max-w-2xl space-y-8 text-white">
        <SpotifyUrlField />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs tracking-widest text-neutral-400">タイトル</label>
            <Input {...form.register("title", { required: true })} />
          </div>
          <div className="space-y-2">
            <label className="text-xs tracking-widest text-neutral-400">アーティスト</label>
            <Input {...form.register("artist", { required: true })} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs tracking-widest text-neutral-400">役割</label>
          <div className="flex gap-4">
            {ROLE_OPTIONS.map((r) => (
              <label key={r} className="flex items-center gap-1.5 text-sm text-neutral-300">
                <input type="checkbox" value={r} {...form.register("roles")} />
                {r}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs tracking-widest text-neutral-400">リリース日</label>
            <Input type="date" {...form.register("releaseDate")} />
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-2 text-sm text-neutral-300">
              <input type="checkbox" {...form.register("isPublished")} />
              公開する
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs tracking-widest text-neutral-400">クレジット</label>
            <Button type="button" onClick={() => credits.append({ role: "", name: "" })}>
              + 追加
            </Button>
          </div>
          <div className="space-y-2">
            {credits.fields.map((f, i) => (
              <div key={f.id} className="flex gap-2">
                <Input placeholder="役割 (例: Vocal)" {...form.register(`credits.${i}.role`)} />
                <Input placeholder="名前" {...form.register(`credits.${i}.name`)} />
                <Button type="button" onClick={() => credits.remove(i)} className="bg-neutral-800 text-white hover:bg-neutral-700">
                  削除
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs tracking-widest text-neutral-400">リンク</label>
            <Button type="button" onClick={() => links.append({ platform: "spotify", url: "" })}>
              + 追加
            </Button>
          </div>
          <div className="space-y-2">
            {links.fields.map((f, i) => (
              <div key={f.id} className="flex gap-2">
                <select
                  {...form.register(`links.${i}.platform`)}
                  className="rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                >
                  {PLATFORM_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <Input placeholder="https://..." {...form.register(`links.${i}.url`)} />
                <Button type="button" onClick={() => links.remove(i)} className="bg-neutral-800 text-white hover:bg-neutral-700">
                  削除
                </Button>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <Button type="submit" disabled={pending} className="rounded-full px-8 py-3">
          {pending ? "保存中…" : submitLabel}
        </Button>
      </form>
    </FormProvider>
  );
}
