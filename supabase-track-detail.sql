-- ============================================================
-- Явц шалгах RPC — зураг, байршил, агуулгыг буцаах (НУУЦЛАЛТАЙ)
--
--  • Нийтэд нээлттэй (is_public = true) санал → зураг/байршил/агуулга
--    бүрэн (нийтийн санал шиг харагдана).
--  • Хувийн санал → зөвхөн төлөв, ангилал, огноо, албаны хариу,
--    шийдвэрлэлтийн явц. Агуулга/байршил/зураг ГАДАГШАА ГАРАХГҮЙ —
--    тасалбарын дугаар таамагласан ч хувийн мэдээлэл хамгаалагдсан.
--
--  Supabase → SQL Editor дээр бүхэлд нь Run. Дахин ажиллуулахад аюулгүй.
-- ============================================================

-- Дутуу баганууд байвал нэмнэ (өмнөх migration ажиллаагүй байсан ч аюулгүй)
alter table public.feedback
  add column if not exists org        text,
  add column if not exists letter_no  text,
  add column if not exists letter_url text,
  add column if not exists district   text,
  add column if not exists khoroo     text;

drop function if exists public.track_feedback(text);
create function public.track_feedback(p_ticket text)
returns table(ticket text, subject text, status text,
              created_at timestamptz, updated_at timestamptz, response text,
              org text, letter_no text, letter_url text,
              message text, district text, khoroo text,
              lat double precision, lng double precision,
              photos text[], is_public boolean)
language plpgsql security definer set search_path = public as $$
declare v_clean text; v_seq bigint;
begin
  v_clean := upper(btrim(coalesce(p_ticket,'')));
  v_seq := nullif(regexp_replace(split_part(v_clean,'-',3),'\D','','g'),'')::bigint;
  if v_seq is null then
    v_seq := nullif(regexp_replace(v_clean,'\D','','g'),'')::bigint;
  end if;
  if v_seq is null then return; end if;
  return query
    select 'AT-' || to_char(f.created_at,'YYYY') || '-' || lpad(f.ticket_seq::text,6,'0'),
           f.subject, f.status, f.created_at, f.updated_at, f.response,
           f.org, f.letter_no, f.letter_url,
           -- Зөвхөн нийтэд нээлттэй санал бол агуулга/байршил/зураг гаргана
           case when f.is_public then f.message  else null end,
           case when f.is_public then f.district else null end,
           case when f.is_public then f.khoroo   else null end,
           case when f.is_public then f.lat      else null end,
           case when f.is_public then f.lng      else null end,
           case when f.is_public then f.photos   else null end,
           coalesce(f.is_public, false)
    from public.feedback f
    where f.ticket_seq = v_seq
    limit 1;
end $$;
grant execute on function public.track_feedback(text) to anon, authenticated;

-- "Success" гарвал бэлэн.
--   Нийтийн санал → зураг/байршил/агуулгатай бүрэн харагдана.
--   Хувийн санал → зөвхөн төлөв/огноо/хариу (нууцлал хамгаалагдсан).
