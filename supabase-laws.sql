-- ============================================================
--  Ц.Баатархүү — Хууль (CMS) тохиргоо
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
--  (PDF хадгалахад өмнө үүсгэсэн 'reports' bucket-ийг ашиглана.)
-- ============================================================

create table if not exists public.laws (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null,
  category    text not null default 'own',       -- own (Өргөн барьсан) | co (Хамтран санаачилсан)
  date_label  text,                              -- "2026.05"
  topic       text,                              -- "Иргэдийн мэдээллийн хамгаалалт"
  summary     text,                              -- дэлгэрэнгүй тайлбар (карт дээр дарахад)
  status      text not null default 'review',    -- passed|review|support|discussed|notstarted|withdrawn
  pdf_url     text,
  sort        int not null default 0,
  published   boolean not null default true
);
create index if not exists laws_sort_idx on public.laws (sort, created_at desc);

alter table public.laws enable row level security;

drop policy if exists "anyone read published laws" on public.laws;
create policy "anyone read published laws"
  on public.laws for select to anon, authenticated using (published = true);

drop policy if exists "admin read all laws" on public.laws;
create policy "admin read all laws" on public.laws for select to authenticated using (true);
drop policy if exists "admin insert laws" on public.laws;
create policy "admin insert laws" on public.laws for insert to authenticated with check (true);
drop policy if exists "admin update laws" on public.laws;
create policy "admin update laws" on public.laws for update to authenticated using (true) with check (true);
drop policy if exists "admin delete laws" on public.laws;
create policy "admin delete laws" on public.laws for delete to authenticated using (true);

-- ============================================================
--  "Success" гарвал бэлэн. Админ → Хууль табаас нэмж эхэлнэ.
--  PDF файл нь 'reports' санд хадгалагдана (supabase-reports.sql
--  ажилласан байх ёстой). Холбоос (parliament.mn г.м) ч оруулж болно.
--  Хоосон үед huuli.html дээрх одоогийн жишээ хууль хэвээр.
-- ============================================================
