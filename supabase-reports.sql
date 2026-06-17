-- ============================================================
--  Ц.Баатархүү — Тайлан (CMS) тохиргоо
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
-- ============================================================

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  kind        text not null default 'month',  -- 'month' (сарын) | 'year' (жилийн)
  title       text not null,
  category    text,                            -- "Сарын тайлан · 5-р сар"
  meta        text,                            -- "PDF · 7 хуудас"
  pdf_url     text,
  cover_url   text,
  sort        int not null default 0,
  published   boolean not null default true
);
create index if not exists reports_sort_idx on public.reports (sort, created_at desc);

alter table public.reports enable row level security;

drop policy if exists "anyone read published reports" on public.reports;
create policy "anyone read published reports"
  on public.reports for select to anon, authenticated using (published = true);

drop policy if exists "admin read all reports" on public.reports;
create policy "admin read all reports" on public.reports for select to authenticated using (true);
drop policy if exists "admin insert reports" on public.reports;
create policy "admin insert reports" on public.reports for insert to authenticated with check (true);
drop policy if exists "admin update reports" on public.reports;
create policy "admin update reports" on public.reports for update to authenticated using (true) with check (true);
drop policy if exists "admin delete reports" on public.reports;
create policy "admin delete reports" on public.reports for delete to authenticated using (true);

-- Файлын сан (PDF + нүүр зураг, нийтэд харагдах). Дээд тал 20MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reports', 'reports', true, 20971520,
        array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone read report file" on storage.objects;
create policy "anyone read report file" on storage.objects for select to anon, authenticated
  using (bucket_id = 'reports');
drop policy if exists "admin upload report file" on storage.objects;
create policy "admin upload report file" on storage.objects for insert to authenticated
  with check (bucket_id = 'reports');
drop policy if exists "admin delete report file" on storage.objects;
create policy "admin delete report file" on storage.objects for delete to authenticated
  using (bucket_id = 'reports');

-- ============================================================
--  "Success" гарвал бэлэн. Админ → Тайлан табаас нэмж эхэлнэ.
--  Хоосон үед tailan.html дээрх одоогийн жишээ тайлан хэвээр.
-- ============================================================
