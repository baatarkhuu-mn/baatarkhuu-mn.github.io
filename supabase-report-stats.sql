-- ============================================================
-- Тайлангийн үзүүлэлтийг оруулсан өгөгдлөөс автоматаар бодох.
-- Зөвхөн НИЙЛБЭР тоо буцаана (хувь хүний мэдээлэл ил гарахгүй).
-- Supabase → SQL Editor дээр бүхэлд нь Run. Дахин ажиллуулахад аюулгүй.
-- ============================================================

create or replace function public.report_stats()
returns table(
  feedback_total  bigint,
  feedback_done   bigint,
  laws_total      bigint,
  projects_total  bigint,
  events_total    bigint
)
language sql security definer set search_path = public as $$
  select
    (select count(*) from public.feedback),
    (select count(*) from public.feedback where status = 'done'),
    (select count(*) from public.laws     where published = true),
    (select count(*) from public.projects where published = true),
    (select count(*) from public.events)
$$;

grant execute on function public.report_stats() to anon, authenticated;
