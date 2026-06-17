-- ============================================================
--  Ц.Баатархүү — Утсаараа санал сэргээх
--  Иргэн дугаараа мартсан / өөр төхөөрөмж ашиглаж байвал утасны
--  дугаараа оруулж өөрийн саналуудын ДУГААР+ТӨЛӨВ-ийг хардаг.
--  Зөвхөн дугаар/ангилал/төлөв/огноо буцаана — агуулга, зураг,
--  байршил, нэр ГАРАХГҮЙ (задралыг хязгаарлана).
--  Supabase SQL Editor дотор хуулж "Run" дарна.
-- ============================================================

create or replace function public.track_by_phone(p_phone text)
returns table(ticket text, subject text, status text, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare digits text;
begin
  digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  if length(digits) < 6 then return; end if;  -- хэт богино дугаараар бүхэлд нь жагсаахаас сэргийлнэ
  return query
    select 'AT-' || to_char(f.created_at, 'YYYY') || '-' || lpad(f.ticket_seq::text, 6, '0'),
           f.subject, f.status, f.created_at
    from public.feedback f
    where regexp_replace(coalesce(f.phone, ''), '\D', '', 'g') = digits
    order by f.created_at desc
    limit 20;
end $$;
grant execute on function public.track_by_phone(text) to anon, authenticated;

-- "Success" гарвал бэлэн.
