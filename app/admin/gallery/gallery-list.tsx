"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteGalleryImage,
  importStaticGallery,
  setGalleryImagePublished,
  updateGalleryImageAlt,
} from "./_actions/save-image";

type ImageRow = {
  id: string;
  image_path: string;
  alt: string;
  is_published: boolean;
  sort_order: number;
  url: string;
};

function AltEditor({ id, initialAlt }: { id: string; initialAlt: string }) {
  const [alt, setAlt] = useState(initialAlt);
  const [saved, setSaved] = useState(initialAlt);
  const [pending, startTransition] = useTransition();

  const save = () => {
    if (alt === saved) return;
    startTransition(async () => {
      try {
        await updateGalleryImageAlt(id, alt);
        setSaved(alt);
        toast.success("説明文を保存しました");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "保存に失敗しました");
      }
    });
  };

  return (
    <input
      value={alt}
      onChange={(e) => setAlt(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      placeholder="画像の説明（ホームページにも表示されます）"
      disabled={pending}
      className="w-full flex-1 rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus:ring-1 focus:ring-white disabled:opacity-50"
    />
  );
}

function ImportButton() {
  const [pending, startTransition] = useTransition();

  const run = () => {
    startTransition(async () => {
      try {
        await importStaticGallery();
        toast.success("取り込みました");
      } catch (e) {
        // "N枚取り込みました(M枚は失敗…)" のような部分成功メッセージもここに来る
        const message = e instanceof Error ? e.message : "取り込みに失敗しました";
        if (message.includes("枚取り込みました")) toast.success(message);
        else toast.error(message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={run}
      disabled={pending}
      className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black hover:bg-neutral-200 disabled:opacity-50"
    >
      {pending ? "取り込み中…" : "既存の8枚をこの管理画面に取り込む"}
    </button>
  );
}

export function GalleryList({ initialImages }: { initialImages: ImageRow[] }) {
  const [images, setImages] = useState(initialImages);
  const [, startTransition] = useTransition();

  const onTogglePublish = (img: ImageRow) => {
    setImages((prev) =>
      prev.map((i) => (i.id === img.id ? { ...i, is_published: !i.is_published } : i)),
    );
    startTransition(async () => {
      try {
        await setGalleryImagePublished(img.id, !img.is_published);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "更新に失敗しました");
      }
    });
  };

  const onDelete = (img: ImageRow) => {
    setImages((prev) => prev.filter((i) => i.id !== img.id));
    startTransition(async () => {
      try {
        await deleteGalleryImage(img.id, img.image_path);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "削除に失敗しました");
      }
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {images.map((img) => (
        <div
          key={img.id}
          className="flex flex-wrap items-center gap-3 rounded-lg border border-white/10 px-4 py-3"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.alt} className="size-14 shrink-0 rounded object-cover" />
          <AltEditor id={img.id} initialAlt={img.alt} />
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${
              img.is_published ? "bg-emerald-600/80" : "bg-neutral-700"
            }`}
          >
            {img.is_published ? "公開中" : "下書き"}
          </span>
          <button
            type="button"
            onClick={() => onTogglePublish(img)}
            className="shrink-0 text-xs text-neutral-300 hover:text-white"
          >
            {img.is_published ? "非公開にする" : "公開する"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(img)}
            className="shrink-0 text-xs text-red-400 hover:text-red-300"
          >
            削除
          </button>
        </div>
      ))}

      {images.length === 0 && (
        <div className="rounded-lg border border-dashed border-white/15 px-4 py-6 text-center">
          <p className="mb-3 text-sm text-neutral-500">まだ登録がありません。</p>
          <p className="mb-4 text-xs text-neutral-500">
            現在トップページに表示されている「スタジオ風景 &amp; GALLERY」の8枚は、
            まだこの管理画面には取り込まれていません（静的な画像のままです）。
          </p>
          <ImportButton />
        </div>
      )}

      {images.length > 0 && images.length < 8 && (
        <div className="mt-2 rounded-lg border border-dashed border-white/15 px-4 py-4 text-center">
          <p className="mb-3 text-xs text-neutral-500">
            既存の8枚のうち、まだ一部しか取り込まれていない可能性があります。
          </p>
          <ImportButton />
        </div>
      )}
    </div>
  );
}
