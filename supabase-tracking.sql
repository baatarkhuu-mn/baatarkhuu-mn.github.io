-- ============================================================
--  Ц.Баатархүү — Дараалсан тасалбарын дугаар + явц шалгах
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
--  (Эхлээд supabase-setup.sql ажилласан байх ёстой.)
--
--  Иргэн санал илгээхэд #AT-2026-000001 хэлбэрийн ДАРААЛСАН дугаар
--  үүснэ. Дугаараа бичээд явцаа (хүлээн авсан/шийдвэрлэж буй/
--  шийдвэрлэсэн) болон албаны хариуг шалгана. Нэр/утас/байршил
--  ХЭЗЭЭ Ч гадагшаа гарахгүй — зөвхөн төлөв, ангилал, огноо, хариу.
-- ============================================================

-- 1) Дараалсан дугаарын sequence + шинэ баганууд -----------------
create sequence if not exists public.feedback_ticket_seq;

alter table public.feedback
  add column if not exists ticket_seq bigint default nextval('public.feedback_ticket_seq'),
  add column if not exists response   text,            -- админы нийтэд харагдах хариу
  add column if not exists updated_at timestamptz;     -- төлөв сүүлд шинэчилсэн

-- Одоо байгаа (хуучин) мөрүүдэд дугаар онооx
update public.feedback
  set ticket_seq = nextval('public.feedback_ticket_seq')
  where ticket_seq is null;

-- 2) Төлөв/хариу өөрчлөгдөхөд updated_at автоматаар шинэчлэх ------
create or replace function public.feedback_touch()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists feedback_touch_trg on public.feedback;
create trigger feedback_touch_trg
  before update on public.feedback
  for each row execute function public.feedback_touch();

-- 3) Илгээх RPC — мөр оруулаад ДУГААРЫГ буцаана -------------------
-- (anon шууд select хийж чадахгүй тул дугаарыг функцээр буцаана)
create or replace function public.submit_feedback(
  p_name text, p_phone text, p_subject text, p_message text,
  p_lat double precision, p_lng double precision,
  p_rating int, p_photos text[], p_is_public boolean
) returns text
language plpgsql security definer set search_path = public as $$
declare v_seq bigint; v_at timestamptz;
begin
  if coalesce(btrim(p_message),'') = '' then
    raise exception 'message required';
  end if;
  insert into public.feedback
    (name, phone, subject, message, lat, lng, rating, photos, is_public)
  values
    (nullif(btrim(p_name),''), nullif(btrim(p_phone),''), p_subject,
     p_message, p_lat, p_lng, p_rating, coalesce(p_photos,'{}'),
     coalesce(p_is_public,false))
  returning ticket_seq, created_at into v_seq, v_at;
  return 'AT-' || to_char(v_at,'YYYY') || '-' || lpad(v_seq::text,6,'0');
end $$;

grant execute on function
  public.submit_feedback(text,text,text,text,double precision,double precision,int,text[],boolean)
  to anon, authenticated;

-- 4) Явц шалгах RPC — зөвхөн аюулгүй мэдээлэл буцаана -------------
create or replace function public.track_feedback(p_ticket text)
returns table(ticket text, subject text, status text,
              created_at timestamptz, updated_at timestamptz, response text)
language plpgsql security definer set search_path = public as $$
declare v_clean text; v_seq bigint;
begin
  v_clean := upper(btrim(coalesce(p_ticket,'')));
  -- 'AT-2026-000482' → 3 дахь хэсэг '000482'
  v_seq := nullif(regexp_replace(split_part(v_clean,'-',3),'\D','','g'),'')::bigint;
  if v_seq is null then
    -- зөвхөн тоо бичсэн бол
    v_seq := nullif(regexp_replace(v_clean,'\D','','g'),'')::bigint;
  end if;
  if v_seq is null then return; end if;

  return query
    select 'AT-' || to_char(f.created_at,'YYYY') || '-' || lpad(f.ticket_seq::text,6,'0'),
           f.subject, f.status, f.created_at, f.updated_at, f.response
    from public.feedback f
    where f.ticket_seq = v_seq
    limit 1;
end $$;

grant execute on function public.track_feedback(text) to anon, authenticated;

-- ============================================================
--  "Success" гарвал бэлэн.
--  Иргэн форм илгээхэд жинхэнэ дараалсан дугаар үүснэ;
--  "Явц шалгах" хэсэгт дугаараа бичээд төлөвөө хардаг болно.
-- ============================================================
