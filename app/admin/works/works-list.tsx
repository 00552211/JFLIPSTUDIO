"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { deleteWork, reorderWorks, setWorkPublished } from "./_actions/save-work";

type WorkRow = {
  id: string;
  title: string;
  artist: string;
  roles: string[];
  is_published: boolean;
};

export function WorksList({ initialWorks }: { initialWorks: WorkRow[] }) {
  const [works, setWorks] = useState(initialWorks);
  const [pending, startTransition] = useTransition();
  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const persistOrder = (next: WorkRow[]) => {
    startTransition(() => {
      reorderWorks(next.map((w) => w.id));
    });
  };

  const onDragStart = (index: number) => {
    dragIndex.current = index;
  };

  const onDragOver = (index: number, e: React.DragEvent) => {
    e.preventDefault();
    setOverIndex(index);
    if (dragIndex.current === null || dragIndex.current === index) return;
    setWorks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex.current!, 1);
      next.splice(index, 0, moved);
      dragIndex.current = index;
      return next;
    });
  };

  const onDragEnd = () => {
    dragIndex.current = null;
    setOverIndex(null);
    persistOrder(works);
  };

  if (works.length === 0) {
    return <p className="text-sm text-neutral-500">まだ登録がありません。</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {pending && <p className="text-xs text-neutral-500">並び順を保存中…</p>}
      {works.map((w, i) => (
        <div
          key={w.id}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={(e) => onDragOver(i, e)}
          onDrop={(e) => e.preventDefault()}
          onDragEnd={onDragEnd}
          className={`flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
            overIndex === i ? "border-white/40 bg-white/5" : "border-white/10"
          }`}
        >
          <span
            className="cursor-grab select-none text-neutral-500 hover:text-neutral-300 active:cursor-grabbing"
            title="ドラッグして並び替え"
          >
            ⠿
          </span>
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
    </div>
  );
}
