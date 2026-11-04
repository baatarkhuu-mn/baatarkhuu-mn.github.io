-- ============================================================
-- Facebook автомат синк — давхардал хамгаалалт
-- Supabase → SQL Editor дээр бүхэлд нь ажиллуулна. Дахин ажиллуулахад аюулгүй.
-- ============================================================

alter table public.news add column if not exists fb_post_id text;
create unique index if not exists news_fb_post_id_key on public.news (fb_post_id);
create index if not exists videos_url_idx on public.videos (url);
