-- ============================================================
--  Санал хүсэлтийн статус дашбоард — feedback_stats()-д
--  "Хариуцсан байгууллагад илгээсэн" (routed) ба "Хариу ирсэн"
--  (responded) тоог нэмж, автоматаар тоолуулна.
--  Supabase → SQL Editor дээр бүхэлд нь Run. Дахин ажиллуулахад аюулгүй.
-- ============================================================

-- Дутуу баганууд байвал нэмнэ (аюулгүй)
alter table public.feedback
  add column if not exists org      text,
  add column if not exists response text;

create or replace function public.feedback_stats()
returns json
language sql security definer set search_path = public as $$
  select json_build_object(
    'total',       (select count(*) from public.feedback),
    'month',       (select count(*) from public.feedback where created_at >= date_trunc('month', now())),
    -- Хариуцсан байгууллагад илгээсэн: routed-оос цааш явсан ЭСВЭЛ байгууллага онооссон
    'routed',      (select count(*) from public.feedback
                    where status in ('routed','processing','responded','done')
                       or nullif(btrim(coalesce(org,'')),'') is not null),
    -- Хариу ирсэн: responded/done ЭСВЭЛ албаны хариу бичсэн
    'responded',   (select count(*) from public.feedback
                    where status in ('responded','done')
                       or nullif(btrim(coalesce(response,'')),'') is not null),
    'resolved',    (select count(*) from public.feedback where status = 'done'),
    'in_progress', (select count(*) from public.feedback where status = 'in_progress'),
    'supports',    (select count(*) from public.feedback_likes),
    'public_count',(select count(*) from public.feedback where is_public = true),
    'by_subject',  (select coalesce(json_object_agg(subject, c), '{}'::json)
                    from (select subject, count(*) c from public.feedback group by subject) s)
  );
$$;
grant execute on function public.feedback_stats() to anon, authenticated;

-- "Success" гарвал бэлэн. Дашбоард автоматаар тоолж эхэлнэ.
