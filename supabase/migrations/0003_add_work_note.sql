-- アルバムの一部の曲だけ担当、といった補足を自由記述できる欄
alter table public.works add column if not exists note text;
