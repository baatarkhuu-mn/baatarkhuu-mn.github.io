-- ============================================================
--  Ц.Баатархүү — Арга хэмжээ + бүртгэл (CMS) тохиргоо
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
-- ============================================================

-- 1) Арга хэмжээ ------------------------------------------------
create table if not exists public.events (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  title       text not null,
  description text,
  location    text,                              -- "Чингэлтэй дүүрэг"
  time_label  text,                              -- "15:00"
  event_date  date,                              -- огноо (хаяг дээрх өдөр/сар)
  image_url   text,
  badge       text default 'Зарлал',
  register_enabled boolean not null default true,
  register_url text,                             -- гадаад бүртгэлийн холбоос (заавал биш)
  sort        int not null default 0,
  published   boolean not null default true
);
create index if not exists events_date_idx on public.events (event_date, sort);

alter table public.events enable row level security;
drop policy if exists "anyone read published events" on public.events;
create policy "anyone read published events" on public.events for select to anon, authenticated using (published = true);
drop policy if exists "admin read all events" on public.events;
create policy "admin read all events" on public.events for select to authenticated using (true);
drop policy if exists "admin insert events" on public.events;
create policy "admin insert events" on public.events for insert to authenticated with check (true);
drop policy if exists "admin update events" on public.events;
create policy "admin update events" on public.events for update to authenticated using (true) with check (true);
drop policy if exists "admin delete events" on public.events;
create policy "admin delete events" on public.events for delete to authenticated using (true);

-- Зургийн сан
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('events', 'events', true, 8388608, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public;
drop policy if exists "anyone read event photo" on storage.objects;
create policy "anyone read event photo" on storage.objects for select to anon, authenticated using (bucket_id = 'events');
drop policy if exists "admin upload event photo" on storage.objects;
create policy "admin upload event photo" on storage.objects for insert to authenticated with check (bucket_id = 'events');
drop policy if exists "admin delete event photo" on storage.objects;
create policy "admin delete event photo" on storage.objects for delete to authenticated using (bucket_id = 'events');

-- 2) Бүртгэл ----------------------------------------------------
create table if not exists public.event_registrations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  event_id    uuid not null references public.events(id) on delete cascade,
  name        text,
  phone       text,
  note        text
);
create index if not exists event_reg_idx on public.event_registrations (event_id, created_at);

alter table public.event_registrations enable row level security;
-- Иргэн (нэвтрээгүй) зөвхөн БҮРТГҮҮЛНЭ (insert). Уншихыг зөвшөөрөхгүй (нууцлал).
drop policy if exists "anyone register event" on public.event_registrations;
create policy "anyone register event" on public.event_registrations for insert to anon, authenticated with check (true);
-- Зөвхөн админ бүртгэлийг УНШИНА / устгана
drop policy if exists "admin read regs" on public.event_registrations;
create policy "admin read regs" on public.event_registrations for select to authenticated using (true);
drop policy if exists "admin delete regs" on public.event_registrations;
create policy "admin delete regs" on public.event_registrations for delete to authenticated using (true);

-- 3) Бүртгэлийн тоо (нийтэд — зөвхөн тоо) ------------------------
create or replace function public.event_reg_counts()
returns table(event_id uuid, cnt int)
language sql security definer set search_path = public as $$
  select event_id, count(*)::int from public.event_registrations group by event_id;
$$;
grant execute on function public.event_reg_counts() to anon, authenticated;

-- ============================================================
--  "Success" гарвал бэлэн. Админ → Арга хэмжээ табаас нэмж эхэлнэ.
--  Хоосон үед index.html дээрх жишээ арга хэмжээ хэвээр.
-- ============================================================
