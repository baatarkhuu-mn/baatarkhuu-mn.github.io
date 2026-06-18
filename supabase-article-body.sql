-- ============================================================
-- Дэлгэрэнгүй мэдээний агуулга (body) талбар нэмэх
-- Мэдээ, төсөл, арга хэмжээ дээр дарахад нээгдэх бүрэн текст.
-- Supabase → SQL Editor дээр энэ кодыг бүхэлд нь ажиллуулна уу.
-- (Дахин ажиллуулахад аюулгүй — "if not exists".)
-- ============================================================

alter table public.news     add column if not exists body text;
alter table public.projects add column if not exists body text;
alter table public.events   add column if not exists body text;
