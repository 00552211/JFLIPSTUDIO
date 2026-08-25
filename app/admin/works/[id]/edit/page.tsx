import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";
import { WorkForm } from "../../work-form";
import { updateWork } from "../../_actions/save-work";

export default async function EditWorkPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const supabase = await createClient();

  const { data: work } = await supabase.from("works").select("*").eq("id", id).maybeSingle();
  if (!work) notFound();

  const { data: credits } = await supabase
    .from("work_credits")
    .select("role,name")
    .eq("work_id", id)
    .order("sort_order");
  const { data: links } = await supabase
    .from("work_links")
    .select("platform,url")
    .eq("work_id", id)
    .order("sort_order");

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-8 text-xl font-bold text-white">Work 編集</h1>
      <WorkForm
        submitLabel="更新する"
        onSubmitAction={updateWork.bind(null, id)}
        defaultValues={{
          title: work.title,
          artist: work.artist,
          roles: work.roles ?? [],
          releaseDate: work.release_date ?? "",
          spotifyTrackId: work.spotify_track_id,
          spotifyUrl: work.spotify_url ?? "",
          durationMs: work.duration_ms,
          jacketPath: work.jacket_path,
          isPublished: work.is_published,
          credits: credits ?? [],
          links: links ?? [],
        }}
      />
    </div>
  );
}
