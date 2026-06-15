-- ============================================================
--  Ц.Баатархүү — Санал хүсэлтийн backend тохиргоо
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
--  (Supabase.com → таны төсөл → зүүн талын "SQL Editor" → New query)
-- ============================================================

-- 1) Санал хүсэлтийн хүснэгт ------------------------------------
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text,
  email       text,
  phone       text,
  subject     text,                 -- санал/өргөдөл/гомдол/асуудал/уулзалт/бусад
  district    text,                 -- Чингэлтэй/Сүхбаатар/Бусад
  khoroo      text,
  message     text not null,
  lat         double precision,     -- GPS өргөрөг
  lng         double precision,     -- GPS уртраг
  rating      smallint,             -- 1–10 үнэлгээ
  photos      text[] default '{}',  -- зургийн замууд (storage)
  status      text not null default 'new'  -- new / in_progress / done
);

-- Шинэ нь эхэндээ гарч ирэхээр индекс
create index if not exists feedback_created_idx on public.feedback (created_at desc);

-- 2) RLS (мөр түвшний хамгаалалт) асаах --------------------------
alter table public.feedback enable row level security;

-- Иргэн (нэвтрээгүй) ЗӨВХӨН илгээж чадна (insert)
drop policy if exists "anyone can submit feedback" on public.feedback;
create policy "anyone can submit feedback"
  on public.feedback for insert
  to anon, authenticated
  with check (true);

-- Зөвхөн нэвтэрсэн админ бүх саналыг УНШИНА
drop policy if exists "only admin can read" on public.feedback;
create policy "only admin can read"
  on public.feedback for select
  to authenticated
  using (true);

-- Зөвхөн админ төлөв шинэчилнэ / устгана
drop policy if exists "only admin can update" on public.feedback;
create policy "only admin can update"
  on public.feedback for update
  to authenticated using (true) with check (true);

drop policy if exists "only admin can delete" on public.feedback;
create policy "only admin can delete"
  on public.feedback for delete
  to authenticated using (true);

-- 3) Зургийн сан (storage bucket) -------------------------------
-- Дээд тал нь 8MB, зөвхөн зураг. Нийтэд унших боломжгүй (хувийн).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback-photos', 'feedback-photos', false, 8388608,
        array['image/jpeg','image/png','image/webp','image/gif','image/heic'])
on conflict (id) do update
  set file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Иргэн зураг ХУУЛЖ чадна (upload)
drop policy if exists "anyone can upload feedback photo" on storage.objects;
create policy "anyone can upload feedback photo"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'feedback-photos');

-- Зөвхөн админ зургийг ХАРНА
drop policy if exists "only admin can view feedback photo" on storage.objects;
create policy "only admin can view feedback photo"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'feedback-photos');

-- ============================================================
--  Дууссаны дараа: "Success" гэвэл бэлэн.
--  Админд нэвтрэх нэр/нууц үг = CRM-д үүсгэсэн админ хэрэглэгчийнхтэй ИЖИЛ.
-- ============================================================
