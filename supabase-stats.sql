-- ============================================================
--  Ц.Баатархүү — Санал хүсэлтийн тойм (dashboard) + нийтийн view шинэчлэл
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
--  (Эхлээд supabase-setup + public-feed + tracking ажилласан байх ёстой.)
-- ============================================================

-- 1) Нийтийн тоон үзүүлэлт (хувийн мэдээлэлгүй — зөвхөн тоо) ------
create or replace function public.feedback_stats()
returns json
language sql security definer set search_path = public as $$
  select json_build_object(
    'total',       (select count(*) from public.feedback),
    'month',       (select count(*) from public.feedback where created_at >= date_trunc('month', now())),
    'resolved',    (select count(*) from public.feedback where status = 'done'),
    'in_progress', (select count(*) from public.feedback where status = 'in_progress'),
    'supports',    (select count(*) from public.feedback_likes),
    'public_count',(select count(*) from public.feedback where is_public = true),
    'by_subject',  (select coalesce(json_object_agg(subject, c), '{}'::json)
                    from (select subject, count(*) c from public.feedback group by subject) s)
  );
$$;
grant execute on function public.feedback_stats() to anon, authenticated;

-- 2) Нийтэд харагдах view-д дугаар / төлөв / хариу нэмэх ----------
drop view if exists public.public_feedback;
create view public.public_feedback as
  select id, created_at, subject, district, khoroo, message, photos, rating,
         ticket_seq, status, response
  from public.feedback
  where is_public = true;
grant select on public.public_feedback to anon, authenticated;

-- ============================================================
--  "Success" гарвал бэлэн.
--  feedback_stats() нь зөвхөн ТОО буцаана (нэр/утас/агуулга гарахгүй).
-- ============================================================
