"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

const creditSchema = z.object({
  role: z.string().min(1),
  name: z.string().min(1),
});

const linkSchema = z.object({
  platform: z.enum(["spotify", "apple_music", "youtube", "x", "other"]),
  url: z.string().url(),
});

const workSchema = z.object({
  title: z.string().min(1),
  artist: z.string().min(1),
  roles: z.array(z.enum(["REC", "MIX", "MASTER"])).min(1, "役割を1つ以上選択してください"),
  releaseDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .or(z.literal(""))
    .nullable(),
  spotifyTrackId: z.string().nullable().optional(),
  spotifyUrl: z.string().url().or(z.literal("")).nullable().optional(),
  durationMs: z.number().int().positive().nullable().optional(),
  jacketPath: z.string().nullable().optional(),
  isPublished: z.boolean(),
  credits: z.array(creditSchema),
  links: z.array(linkSchema),
});

export type WorkFormValues = z.infer<typeof workSchema>;

async function replaceChildren(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workId: string,
  data: WorkFormValues,
) {
  await supabase.from("work_credits").delete().eq("work_id", workId);
  await supabase.from("work_links").delete().eq("work_id", workId);

  if (data.credits.length) {
    await supabase.from("work_credits").insert(
      data.credits.map((c, i) => ({ work_id: workId, role: c.role, name: c.name, sort_order: i })),
    );
  }
  if (data.links.length) {
    await supabase.from("work_links").insert(
      data.links.map((l, i) => ({ work_id: workId, platform: l.platform, url: l.url, sort_order: i })),
    );
  }
}

function toWorkRow(data: WorkFormValues) {
  return {
    title: data.title,
    artist: data.artist,
    roles: data.roles,
    release_date: data.releaseDate || null,
    spotify_track_id: data.spotifyTrackId || null,
    spotify_url: data.spotifyUrl || null,
    spotify_synced_at: data.spotifyTrackId ? new Date().toISOString() : null,
    duration_ms: data.durationMs ?? null,
    jacket_path: data.jacketPath ?? null,
    is_published: data.isPublished,
  };
}

export async function createWork(values: WorkFormValues) {
  await requireAdmin();
  const data = workSchema.parse(values);
  const supabase = await createClient();

  const { data: work, error } = await supabase
    .from("works")
    .insert(toWorkRow(data))
    .select("id")
    .single();

  if (error || !work) throw new Error(error?.message ?? "作成に失敗しました");

  await replaceChildren(supabase, work.id, data);

  revalidatePath("/admin/works");
  revalidatePath("/");
  redirect("/admin/works");
}

export async function updateWork(id: string, values: WorkFormValues) {
  await requireAdmin();
  const data = workSchema.parse(values);
  const supabase = await createClient();

  const { error } = await supabase.from("works").update(toWorkRow(data)).eq("id", id);
  if (error) throw new Error(error.message);

  await replaceChildren(supabase, id, data);

  revalidatePath("/admin/works");
  revalidatePath("/");
  redirect("/admin/works");
}

export async function deleteWork(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("works").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/works");
  revalidatePath("/");
}

export async function setWorkPublished(id: string, isPublished: boolean) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from("works").update({ is_published: isPublished }).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/works");
  revalidatePath("/");
}
