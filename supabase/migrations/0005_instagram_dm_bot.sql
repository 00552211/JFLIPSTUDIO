-- =============================================================
-- JFLIPSTUDIO / Instagram DM 自動返信bot
--  - instagram_threads  : 送信者(IGSID)ごとのスレッド状態
--  - instagram_messages : 会話ログ（Claudeへの文脈にも使う）
--
-- スタッフがInstagramアプリから手動で返信すると、Metaのecho通知を検知して
-- 該当スレッドを自動で is_paused = true にする（botが横から割り込まないように）。
-- 再開したい場合はSupabaseのテーブルエディタで is_paused を false に戻す。
-- =============================================================

create table if not exists public.instagram_threads (
  sender_id      text primary key,       -- Instagram-scoped user id (IGSID)
  sender_username text,
  is_paused      boolean not null default false,
  last_message_at timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

drop trigger if exists instagram_threads_touch on public.instagram_threads;
create trigger instagram_threads_touch before update on public.instagram_threads
  for each row execute function public.touch_updated_at();

create table if not exists public.instagram_messages (
  id         uuid primary key default gen_random_uuid(),
  sender_id  text not null references public.instagram_threads(sender_id) on delete cascade,
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  mid        text,                       -- Meta発行のmessage id（echo判定に使用）
  created_at timestamptz not null default now()
);

create index if not exists instagram_messages_sender_idx
  on public.instagram_messages (sender_id, created_at desc);

create unique index if not exists instagram_messages_mid_idx
  on public.instagram_messages (mid) where mid is not null;

-- ---------- RLS -------------------------------------------------------
-- 書き込み・読み込みはWebhook(サービスロールキー)のみ。RLSはservice_roleを
-- バイパスするため実運用には影響しないが、他のテーブルと同じく管理者専用の
-- 閲覧ポリシーだけ用意しておく（将来 admin 画面から会話ログを見る場合用）。
alter table public.instagram_threads enable row level security;
alter table public.instagram_messages enable row level security;

create policy instagram_threads_select_admin on public.instagram_threads
  for select using (public.is_admin());
create policy instagram_messages_select_admin on public.instagram_messages
  for select using (public.is_admin());
