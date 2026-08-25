-- =============================================================
-- JFLIPSTUDIO / Works CMS  初期スキーマ
--  - works            : 制作実績（1レコード = 1曲 or 1作品）
--  - work_credits     : 可変個数のクレジット（手入力）
--  - work_links       : 可変個数の外部リンク
--  - profiles         : 管理者判定
--  - storage bucket   : works（ジャケット画像・公開読み取り）
-- =============================================================

create extension if not exists "pgcrypto";

-- ---------- 管理者判定 -------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'viewer' check (role in ('viewer','admin')),
  created_at  timestamptz not null default now()
);

-- サインアップ時に profiles を自動作成（既定は viewer）
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS ポリシー内から呼ぶ管理者判定（security definer で再帰を避ける）
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (select 1 from public.profiles p where p.id = uid and p.role = 'admin');
$$;

-- ---------- works -----------------------------------------------------
create type public.work_role as enum ('REC','MIX','MASTER');

create table if not exists public.works (
  id                uuid primary key default gen_random_uuid(),
  slug              text unique,
  title             text not null,
  artist            text not null,

  jacket_path       text,                      -- storage: works/jackets/xxx.jpg
  jacket_alt        text,

  roles             public.work_role[] not null default '{}',
  release_date      date,

  -- Spotify 自動取得（fetchSpotifyMeta）
  spotify_track_id  text unique,
  spotify_url       text,
  spotify_synced_at timestamptz,
  duration_ms       integer check (duration_ms is null or duration_ms > 0),
  -- 手入力で上書きされた項目は再同期で潰さない
  manual_fields     text[] not null default '{}',

  sort_order        integer not null default 0,
  is_published      boolean not null default false,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists works_public_idx
  on public.works (sort_order asc, created_at desc)
  where is_published;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists works_touch on public.works;
create trigger works_touch before update on public.works
  for each row execute function public.touch_updated_at();

-- 新規作成時、末尾に積む
create or replace function public.works_default_sort_order()
returns trigger language plpgsql as $$
begin
  if new.sort_order = 0 then
    select coalesce(max(sort_order), 0) + 10 into new.sort_order from public.works;
  end if;
  return new;
end; $$;

drop trigger if exists works_sort_default on public.works;
create trigger works_sort_default before insert on public.works
  for each row execute function public.works_default_sort_order();

-- ---------- work_credits ---------------------------------------------
create table if not exists public.work_credits (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.works(id) on delete cascade,
  role        text not null,               -- Vocal / Guitar / Producer …
  name        text not null,
  sort_order  integer not null default 0
);
create index if not exists work_credits_work_idx
  on public.work_credits (work_id, sort_order);

-- ---------- work_links -----------------------------------------------
create type public.link_platform as enum ('spotify','apple_music','youtube','x','other');

create table if not exists public.work_links (
  id          uuid primary key default gen_random_uuid(),
  work_id     uuid not null references public.works(id) on delete cascade,
  platform    public.link_platform not null default 'other',
  url         text not null check (url ~ '^https?://'),
  sort_order  integer not null default 0,
  unique (work_id, platform, url)
);
create index if not exists work_links_work_idx
  on public.work_links (work_id, sort_order);

-- ---------- 並び替え（1トランザクションで一括更新） -------------------
create or replace function public.reorder_works(ids uuid[])
returns void
language plpgsql
security invoker            -- RLS を通す = 管理者以外は書けない
as $$
begin
  update public.works w
     set sort_order = t.ord * 10
    from (select unnest(ids) as id, generate_subscripts(ids, 1) as ord) t
   where w.id = t.id;
end;
$$;

-- ---------- RLS -------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.works        enable row level security;
alter table public.work_credits enable row level security;
alter table public.work_links   enable row level security;

-- profiles: 本人 or 管理者のみ参照
create policy profiles_select_self on public.profiles
  for select using (id = auth.uid() or public.is_admin());

-- works: 公開分は誰でも / 下書き含む全件は管理者のみ
create policy works_select_published on public.works
  for select using (is_published or public.is_admin());
create policy works_write_admin on public.works
  for all using (public.is_admin()) with check (public.is_admin());

-- 子テーブル: 親が閲覧可能なら閲覧可 / 書き込みは管理者のみ
create policy credits_select on public.work_credits
  for select using (exists (
    select 1 from public.works w
     where w.id = work_id and (w.is_published or public.is_admin())));
create policy credits_write_admin on public.work_credits
  for all using (public.is_admin()) with check (public.is_admin());

create policy links_select on public.work_links
  for select using (exists (
    select 1 from public.works w
     where w.id = work_id and (w.is_published or public.is_admin())));
create policy links_write_admin on public.work_links
  for all using (public.is_admin()) with check (public.is_admin());

-- ---------- Storage ---------------------------------------------------
insert into storage.buckets (id, name, public)
values ('works', 'works', true)
on conflict (id) do nothing;

create policy works_bucket_read on storage.objects
  for select using (bucket_id = 'works');
create policy works_bucket_write_admin on storage.objects
  for all using (bucket_id = 'works' and public.is_admin())
  with check (bucket_id = 'works' and public.is_admin());

-- ---------- 公開側が使うビュー（任意） --------------------------------
create or replace view public.published_works as
  select w.*,
         (select coalesce(jsonb_agg(jsonb_build_object('role', c.role, 'name', c.name)
                  order by c.sort_order), '[]'::jsonb)
            from public.work_credits c where c.work_id = w.id) as credits,
         (select coalesce(jsonb_agg(jsonb_build_object('platform', l.platform, 'url', l.url)
                  order by l.sort_order), '[]'::jsonb)
            from public.work_links l where l.work_id = w.id) as links
    from public.works w
   where w.is_published
   order by w.sort_order asc;

-- 管理者を1人立てる（メールは実際のものに置き換え）
-- update public.profiles set role = 'admin'
--  where id = (select id from auth.users where email = 'admin@example.com');
