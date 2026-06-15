-- ============================================================
--  Ц.Баатархүү — Ил тод санал самбар (public feed) тохиргоо
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
--  (Эхлээд supabase-setup.sql ажилласан байх ёстой.)
--
--  Нууцлал: ЗӨВХӨН иргэн өөрөө зөвшөөрсөн (is_public=true) санал
--  нийтэд харагдана. Нэр/утас/имэйл/яг GPS ХЭЗЭЭ Ч нийтэд гарахгүй —
--  зөвхөн асуудал, зураг, дүүрэг/хороо, үнэлгээ.
-- ============================================================

-- 1) feedback хүснэгтэд "нийтэд ил" багана нэмэх -----------------
alter table public.feedback
  add column if not exists is_public boolean not null default false;

-- 2) Нийтийн зургийн сан (public bucket) -------------------------
-- Зөвшөөрсөн саналын зургийг ЭНД хуулна (нийтэд харагдана).
-- Зөвшөөрөөгүй саналын зураг хуучин "feedback-photos" (хаалттай) дотор хэвээр.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feedback-public', 'feedback-public', true, 8388608,
        array['image/jpeg','image/png','image/webp','image/gif','image/heic'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "anyone upload public photo" on storage.objects;
create policy "anyone upload public photo"
  on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'feedback-public');

drop policy if exists "public read public photo" on storage.objects;
create policy "public read public photo"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'feedback-public');

drop policy if exists "admin delete public photo" on storage.objects;
create policy "admin delete public photo"
  on storage.objects for delete to authenticated
  using (bucket_id = 'feedback-public');

-- 3) Нийтэд харагдах VIEW — ЗӨВХӨН аюулгүй баганууд ----------------
-- View нь эзэмшигчийн (postgres) эрхээр ажиллах тул RLS-ийг тойрч,
-- зөвхөн доорх баганыг гаргана. Нэр/утас/имэйл/lat/lng энд БАЙХГҮЙ.
drop view if exists public.public_feedback;
create view public.public_feedback as
  select
    id, created_at, subject, district, khoroo, message, photos, rating
  from public.feedback
  where is_public = true;

grant select on public.public_feedback to anon, authenticated;

-- 4) Коммент (зочин) ---------------------------------------------
create table if not exists public.feedback_comments (
  id          uuid primary key default gen_random_uuid(),
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists fc_feedback_idx
  on public.feedback_comments (feedback_id, created_at);

alter table public.feedback_comments enable row level security;

-- Зөвхөн НИЙТЭД ИЛ саналын комментыг уншина
drop policy if exists "read comments on public" on public.feedback_comments;
create policy "read comments on public"
  on public.feedback_comments for select to anon, authenticated
  using (exists (select 1 from public.feedback f
                 where f.id = feedback_id and f.is_public));

-- Зөвхөн НИЙТЭД ИЛ саналд коммент бичнэ (1–1000 тэмдэгт)
drop policy if exists "comment on public" on public.feedback_comments;
create policy "comment on public"
  on public.feedback_comments for insert to anon, authenticated
  with check (
    char_length(btrim(body)) between 1 and 1000
    and exists (select 1 from public.feedback f
                where f.id = feedback_id and f.is_public)
  );

-- Зөвхөн админ коммент устгана (модерац)
drop policy if exists "admin delete comment" on public.feedback_comments;
create policy "admin delete comment"
  on public.feedback_comments for delete to authenticated using (true);

-- 5) Лайк (нэргүй, нэг төхөөрөмж = нэг лайк) ----------------------
-- client_id = хөтөч дээрх localStorage дахь санамсаргүй ID.
-- Хүснэгт нь шууд хандалтгүй; зөвхөн доорх SECURITY DEFINER функцээр.
create table if not exists public.feedback_likes (
  feedback_id uuid not null references public.feedback(id) on delete cascade,
  client_id   text not null,
  created_at  timestamptz not null default now(),
  primary key (feedback_id, client_id)
);
alter table public.feedback_likes enable row level security;
-- (Бодлого нэмэхгүй → anon шууд хандаж чадахгүй, зөвхөн функцээр)

-- Лайк дарах/болих (toggle). Шинэ тоог буцаана.
create or replace function public.toggle_like(p_feedback uuid, p_client text)
returns int
language plpgsql security definer set search_path = public as $$
declare cnt int;
begin
  if not exists (select 1 from public.feedback f
                 where f.id = p_feedback and f.is_public) then
    raise exception 'feedback is not public';
  end if;
  if exists (select 1 from public.feedback_likes
             where feedback_id = p_feedback and client_id = p_client) then
    delete from public.feedback_likes
      where feedback_id = p_feedback and client_id = p_client;
  else
    insert into public.feedback_likes (feedback_id, client_id)
      values (p_feedback, p_client);
  end if;
  select count(*) into cnt from public.feedback_likes where feedback_id = p_feedback;
  return cnt;
end $$;
grant execute on function public.toggle_like(uuid, text) to anon, authenticated;

-- Бүх нийтийн саналын лайкны тоог нэг дор авах
create or replace function public.like_counts()
returns table(feedback_id uuid, cnt int)
language sql security definer set search_path = public as $$
  select l.feedback_id, count(*)::int
  from public.feedback_likes l
  join public.feedback f on f.id = l.feedback_id and f.is_public
  group by l.feedback_id;
$$;
grant execute on function public.like_counts() to anon, authenticated;

-- ============================================================
--  "Success" гарвал бэлэн. Хэрэв та аль хэдийн илгээгдсэн хуучин
--  саналуудаас заримыг нийтэд харуулахыг хүсвэл admin самбараас
--  "Нийтэд ил болгох" товчоор тус бүрчлэн нээж болно.
-- ============================================================
