-- ============================================================
-- Санал илгээхэд ИМЭЙЛ хаягийг тусдаа баганад хадгалдаг болгох.
-- Өмнө нь имэйлийг message дотор нэмж байсан тул:
--   • нийтийн feed-д имэйл АЛДАГДАЖ байсан
--   • админд r.email хоосон (тусдаа харагдахгүй) байсан
-- (email багана аль хэдийн feedback хүснэгтэд бий — supabase-setup.sql.)
-- Supabase → SQL Editor дээр бүхэлд нь Run. Дахин ажиллуулахад аюулгүй.
-- ============================================================

-- Хуучин (11 параметртэй, district/khoroo-тай) функцийг устгаад имэйлтэйгээр шинэчилнэ
drop function if exists public.submit_feedback(
  text, text, text, text, double precision, double precision, int, text[], boolean, text, text);

create or replace function public.submit_feedback(
  p_name text, p_phone text, p_subject text, p_message text,
  p_lat double precision, p_lng double precision,
  p_rating int, p_photos text[], p_is_public boolean,
  p_district text default null, p_khoroo text default null,
  p_email text default null
) returns text
language plpgsql security definer set search_path = public as $$
declare v_seq bigint; v_at timestamptz;
begin
  if coalesce(btrim(p_message),'') = '' then
    raise exception 'message required';
  end if;
  insert into public.feedback
    (name, phone, email, subject, message, lat, lng, rating, photos, is_public, district, khoroo)
  values
    (nullif(btrim(p_name),''), nullif(btrim(p_phone),''), nullif(btrim(p_email),''),
     p_subject, p_message, p_lat, p_lng, p_rating, coalesce(p_photos,'{}'),
     coalesce(p_is_public,false), nullif(btrim(p_district),''), nullif(btrim(p_khoroo),''))
  returning ticket_seq, created_at into v_seq, v_at;
  return 'AT-' || to_char(v_at,'YYYY') || '-' || lpad(v_seq::text,6,'0');
end $$;

grant execute on function public.submit_feedback(
  text, text, text, text, double precision, double precision, int, text[], boolean, text, text, text)
  to anon, authenticated;
