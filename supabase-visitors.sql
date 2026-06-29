-- ============================================================
-- Сайтаар зочилсон хүний (давхардаагүй) тоог бүртгэх.
-- Браузер бүрт localStorage-д хадгалсан visitor_id-аар дахин давхцуулахгүй.
-- Supabase → SQL Editor дээр бүхэлд нь Run. Дахин ажиллуулахад аюулгүй.
-- ============================================================

create table if not exists public.site_visitors (
  visitor_id  text primary key,
  first_seen  timestamptz not null default now(),
  last_seen   timestamptz not null default now(),
  visits      int not null default 1
);

alter table public.site_visitors enable row level security;
-- Шууд select/insert хийхгүй — зөвхөн доорх RPC-аар (нууцлал)

-- Зочин бүртгэх (давхцвал last_seen/visits шинэчилнэ)
create or replace function public.track_visit(p_visitor text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if coalesce(btrim(p_visitor),'') = '' then return; end if;
  insert into public.site_visitors (visitor_id) values (btrim(p_visitor))
  on conflict (visitor_id) do update
    set last_seen = now(), visits = public.site_visitors.visits + 1;
end $$;
grant execute on function public.track_visit(text) to anon, authenticated;

-- Админд: давхардаагүй зочин ба нийт зочлолтын тоо
create or replace function public.visitor_stats()
returns table(unique_visitors bigint, total_visits bigint, today_unique bigint)
language sql security definer set search_path = public as $$
  select
    count(*)::bigint,
    coalesce(sum(visits),0)::bigint,
    count(*) filter (where last_seen::date = (now())::date)::bigint
  from public.site_visitors;
$$;
grant execute on function public.visitor_stats() to authenticated;
