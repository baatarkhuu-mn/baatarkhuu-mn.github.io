-- ============================================================
--  Ц.Баатархүү — Мэдээ (CMS) тохиргоо
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
--  (Админ нэвтэрсэн үед мэдээ нэмэх/засах/устгах боломжтой болно.)
-- ============================================================

-- 1) Мэдээний хүснэгт ------------------------------------------
create table if not exists public.news (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  date        text,                  -- харагдах огноо (ж: 2026.05.28)
  category    text,                  -- chuulgan/uulzalt/toirog/tsahim/hyanalt/busad
  title       text not null,
  excerpt     text,                  -- товч агуулга
  link        text,                  -- эх сурвалж / дэлгэрэнгүй холбоос
  image       text,                  -- зургийн public URL (news-photos сангаас)
  published   boolean not null default true
);
create index if not exists news_created_idx on public.news (created_at desc);

-- 2) RLS --------------------------------------------------------
alter table public.news enable row level security;

-- Иргэн (нэвтрээгүй) зөвхөн нийтэлсэн мэдээг УНШИНА
drop policy if exists "anyone read published news" on public.news;
create policy "anyone read published news"
  on public.news for select to anon, authenticated
  using (published = true);

-- Админ (нэвтэрсэн) бүх мэдээг унших + бүрэн удирдах
drop policy if exists "admin read all news" on public.news;
create policy "admin read all news"
  on public.news for select to authenticated using (true);
drop policy if exists "admin insert news" on public.news;
create policy "admin insert news"
  on public.news for insert to authenticated with check (true);
drop policy if exists "admin update news" on public.news;
create policy "admin update news"
  on public.news for update to authenticated using (true) with check (true);
drop policy if exists "admin delete news" on public.news;
create policy "admin delete news"
  on public.news for delete to authenticated using (true);

-- 3) Мэдээний зургийн сан (нийтэд харагдах) ---------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('news-photos', 'news-photos', true, 8388608,
        array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public;

drop policy if exists "anyone read news photo" on storage.objects;
create policy "anyone read news photo"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'news-photos');
drop policy if exists "admin upload news photo" on storage.objects;
create policy "admin upload news photo"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'news-photos');
drop policy if exists "admin delete news photo" on storage.objects;
create policy "admin delete news photo"
  on storage.objects for delete to authenticated
  using (bucket_id = 'news-photos');

-- ============================================================
--  "Success" гарвал бэлэн. Админд нэвтрээд "Мэдээ" таб дээрээс
--  мэдээ нэмж эхэлнэ. Мэдээ нэмэгдмэгц medee.html дээр гарч ирнэ.
-- ============================================================
