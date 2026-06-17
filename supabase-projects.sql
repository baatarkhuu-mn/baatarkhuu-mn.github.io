-- ============================================================
--  Ц.Баатархүү — Төслүүд (CMS) тохиргоо
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
-- ============================================================

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null,
  category    text,                              -- "Спорт, эрүүл мэнд"
  district    text,                              -- "Чингэлтэй"
  date_label  text,                              -- "Чингэлтэй дүүрэг · 2016 оноос"
  description text,
  status      text not null default 'ongoing',   -- ongoing | done | planned
  image_url   text,
  link        text,
  sort        int not null default 0,
  published   boolean not null default true
);
create index if not exists projects_sort_idx on public.projects (sort, created_at desc);

alter table public.projects enable row level security;

drop policy if exists "anyone read published projects" on public.projects;
create policy "anyone read published projects"
  on public.projects for select to anon, authenticated using (published = true);

drop policy if exists "admin read all projects" on public.projects;
create policy "admin read all projects" on public.projects for select to authenticated using (true);
drop policy if exists "admin insert projects" on public.projects;
create policy "admin insert projects" on public.projects for insert to authenticated with check (true);
drop policy if exists "admin update projects" on public.projects;
create policy "admin update projects" on public.projects for update to authenticated using (true) with check (true);
drop policy if exists "admin delete projects" on public.projects;
create policy "admin delete projects" on public.projects for delete to authenticated using (true);

-- Зургийн сан (нийтэд харагдах). Дээд тал 8MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('projects', 'projects', true, 8388608,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public;

drop policy if exists "anyone read project photo" on storage.objects;
create policy "anyone read project photo" on storage.objects for select to anon, authenticated
  using (bucket_id = 'projects');
drop policy if exists "admin upload project photo" on storage.objects;
create policy "admin upload project photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'projects');
drop policy if exists "admin delete project photo" on storage.objects;
create policy "admin delete project photo" on storage.objects for delete to authenticated
  using (bucket_id = 'projects');

-- ============================================================
--  "Success" гарвал бэлэн. Админ → Төслүүд табаас нэмж эхэлнэ.
--  Хоосон үед tusul.html дээрх одоогийн жишээ төслүүд хэвээр.
-- ============================================================
