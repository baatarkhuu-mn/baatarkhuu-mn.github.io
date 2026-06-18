-- ============================================================
-- Видеоны хэлбэр (orientation) талбар нэмэх
-- Утга: 'vertical' (босоо reel — анхдагч), 'landscape' (хөндлөн), 'square'
-- Ингэснээр видео бүр өөрийн харьцаагаар (хар хоосон зайгүй) харагдана.
-- Supabase → SQL Editor дээр ажиллуулна уу. Дахин ажиллуулахад аюулгүй.
-- ============================================================

alter table public.videos add column if not exists orientation text default 'vertical';

-- (Заавал биш) Одоо байгаа бүх видеог босоо болгож тэмдэглэх:
update public.videos set orientation = 'vertical' where orientation is null;
