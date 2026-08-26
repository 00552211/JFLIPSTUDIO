-- 役割に「プロデュース」を追加
alter type public.work_role add value if not exists 'PRODUCE';
