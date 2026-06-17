-- ============================================================
--  Ц.Баатархүү — Видео (CMS) тохиргоо
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
--  Админ нэвтэрсэн үед видео нэмэх/засах/устгах боломжтой.
-- ============================================================

create table if not exists public.videos (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text,
  url         text not null,                 -- Facebook reel / YouTube холбоос
  platform    text not null default 'facebook',  -- 'facebook' | 'youtube'
  featured    boolean not null default false,    -- "Онцлох" нэг видео
  sort        int not null default 0,            -- эрэмбэ (бага нь түрүүнд)
  published   boolean not null default true
);
create index if not exists videos_sort_idx on public.videos (sort, created_at desc);

alter table public.videos enable row level security;

-- Иргэн зөвхөн нийтэлсэн видеог УНШИНА
drop policy if exists "anyone read published videos" on public.videos;
create policy "anyone read published videos"
  on public.videos for select to anon, authenticated
  using (published = true);

-- Админ бүгдийг унших + удирдах
drop policy if exists "admin read all videos" on public.videos;
create policy "admin read all videos"
  on public.videos for select to authenticated using (true);
drop policy if exists "admin insert videos" on public.videos;
create policy "admin insert videos"
  on public.videos for insert to authenticated with check (true);
drop policy if exists "admin update videos" on public.videos;
create policy "admin update videos"
  on public.videos for update to authenticated using (true) with check (true);
drop policy if exists "admin delete videos" on public.videos;
create policy "admin delete videos"
  on public.videos for delete to authenticated using (true);

-- ============================================================
--  "Success" гарвал бэлэн. Админ → Видео табаас нэмж эхэлнэ.
--  Хоосон үед video.html дээрх одоогийн жишээ Reels хэвээр харагдана.
-- ============================================================
