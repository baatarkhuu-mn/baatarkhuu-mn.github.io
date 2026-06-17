-- ============================================================
--  Ц.Баатархүү — Сайтын тохиргоо (холбоо барих, сошиал, нүүр текст)
--  Түлхүүр-утга хүснэгт. Админ засахад сайт даяар шинэчлэгдэнэ.
--  Supabase SQL Editor дотор хуулж "Run" дарна.
-- ============================================================

create table if not exists public.site_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

-- Хэн ч уншина (нийтэд харагдах мэдээлэл)
drop policy if exists "anyone read settings" on public.site_settings;
create policy "anyone read settings" on public.site_settings for select to anon, authenticated using (true);

-- Зөвхөн админ нэмэх/засах
drop policy if exists "admin insert settings" on public.site_settings;
create policy "admin insert settings" on public.site_settings for insert to authenticated with check (true);
drop policy if exists "admin update settings" on public.site_settings;
create policy "admin update settings" on public.site_settings for update to authenticated using (true) with check (true);

-- ============================================================
--  "Success" гарвал бэлэн. Админ → Тохиргоо табаас засна.
--  Хоосон үед сайт дээрх одоогийн утга хэвээр.
-- ============================================================
