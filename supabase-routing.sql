-- ============================================================
-- Иргэдийн асуудлыг холбогдох газар хүргэх (routing + ил тод байдал)
-- feedback-д: хариуцах байгууллага, албан бичгийн дугаар/файл нэмнэ.
-- Нийтийн view + track_feedback RPC-д эдгээрийг (PII-гүй) нэмж гаргана.
-- Supabase → SQL Editor дээр бүхэлд нь Run. Дахин ажиллуулахад аюулгүй.
-- ============================================================

alter table public.feedback
  add column if not exists org        text,   -- хариуцах байгууллага
  add column if not exists letter_no  text,   -- албан бичгийн дугаар
  add column if not exists letter_url text;   -- албан бичгийн холбоос (PDF)

-- Нийтэд харагдах VIEW-г routing/ил тод баганатайгаар дахин үүсгэх
-- (Нэр/утас/имэйл/GPS ОРОХГҮЙ — зөвхөн аюулгүй талбарууд)
drop view if exists public.public_feedback;
create view public.public_feedback as
  select id, created_at, updated_at, subject, district, khoroo, message, photos, rating,
         status, response, ticket_seq, org, letter_no, letter_url
  from public.feedback
  where is_public = true;
grant select on public.public_feedback to anon, authenticated;

-- Явц шалгах RPC-д хариуцах газар + албан бичгийг нэмж буцаах
drop function if exists public.track_feedback(text);
create function public.track_feedback(p_ticket text)
returns table(ticket text, subject text, status text,
              created_at timestamptz, updated_at timestamptz, response text,
              org text, letter_no text, letter_url text)
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
           f.org, f.letter_no, f.letter_url
    from public.feedback f
    where f.ticket_seq = v_seq
    limit 1;
end $$;
grant execute on function public.track_feedback(text) to anon, authenticated;
