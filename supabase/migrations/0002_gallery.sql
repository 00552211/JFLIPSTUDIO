-- =============================================================
-- JFLIPSTUDIO / Gallery CMS
--  - gallery_images   : スタジオ風景ギャラリー画像
--  - storage bucket   : gallery（画像・公開読み取り）
-- =============================================================

create table if not exists public.gallery_images (
  id            uuid primary key default gen_random_uuid(),
  image_path    text not null,          -- storage: gallery/photos/xxx.jpg
  alt           text not null default '',
  sort_order    integer not null default 0,
  is_published  boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists gallery_images_public_idx
  on public.gallery_images (sort_order asc, created_at desc)
  where is_published;

-- touch_updated_at() は 0001_works.sql で定義済み
drop trigger if exists gallery_images_touch on public.gallery_images;
create trigger gallery_images_touch before update on public.gallery_images
  for each row execute function public.touch_updated_at();

-- 新規作成時、末尾に積む
create or replace function public.gallery_images_default_sort_order()
returns trigger language plpgsql as $$
begin
  if new.sort_order = 0 then
    select coalesce(max(sort_order), 0) + 10 into new.sort_order from public.gallery_images;
  end if;
  return new;
end; $$;

drop trigger if exists gallery_images_sort_default on public.gallery_images;
create trigger gallery_images_sort_default before insert on public.gallery_images
  for each row execute function public.gallery_images_default_sort_order();

-- ---------- RLS -------------------------------------------------------
alter table public.gallery_images enable row level security;

-- 公開分は誰でも参照 / 下書き含む全件は管理者のみ
create policy gallery_images_select_published on public.gallery_images
  for select using (is_published or public.is_admin());
create policy gallery_images_write_admin on public.gallery_images
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Storage ---------------------------------------------------
insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do nothing;

create policy gallery_bucket_read on storage.objects
  for select using (bucket_id = 'gallery');
create policy gallery_bucket_write_admin on storage.objects
  for all using (bucket_id = 'gallery' and public.is_admin())
  with check (bucket_id = 'gallery' and public.is_admin());
