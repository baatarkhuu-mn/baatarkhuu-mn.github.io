-- ============================================================
-- Явц шалгах RPC-г баяжуулах — зураг, байршил, агуулгыг буцаах
-- (Иргэн өөрийн тасалбараар шалгахад нийтэлсэн карт шиг харагдана)
-- Supabase → SQL Editor дээр бүхэлд нь Run. Дахин ажиллуулахад аюулгүй.
--
-- АНХААР: Тасалбарын дугаар дараалсан (AT-2026-000001, 000002…) тул
-- агуулга/байршил/зураг шалгах боломжтой болж байгааг анхаарна уу.
-- ============================================================

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
           f.message, f.district, f.khoroo,
           f.lat, f.lng,
           f.photos, f.is_public
    from public.feedback f
    where f.ticket_seq = v_seq
    limit 1;
end $$;
grant execute on function public.track_feedback(text) to anon, authenticated;

-- "Success" гарвал бэлэн. Явц шалгахад зураг, байршил, агуулга нэмж харагдана.
