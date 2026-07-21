-- ============================================================
--  Ц.Баатархүү — Нийтийн санал асуулга (CMS) тохиргоо
--  Supabase SQL Editor дотор ЭНЭ БҮХ кодыг хуулж "Run" дарна.
--  Админ асуулга үүсгэнэ; иргэд нэвтрэлтгүйгээр санал өгнө
--  (нэг төхөөрөмж = нэг санал, дахин дарвал сонголтоо солино).
-- ============================================================

create table if not exists public.polls (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  question    text not null,
  options     jsonb not null default '[]'::jsonb,  -- ["Тийм","Үгүй",...]
  closes_at   timestamptz,                          -- null = хугацаагүй
  published   boolean not null default true,
  sort        int not null default 0
);
create index if not exists polls_sort_idx on public.polls (sort, created_at desc);

alter table public.polls enable row level security;

drop policy if exists "anyone read published polls" on public.polls;
create policy "anyone read published polls"
  on public.polls for select to anon, authenticated
  using (published = true);

drop policy if exists "admin read all polls" on public.polls;
create policy "admin read all polls"
  on public.polls for select to authenticated using (true);
drop policy if exists "admin insert polls" on public.polls;
create policy "admin insert polls"
  on public.polls for insert to authenticated with check (true);
drop policy if exists "admin update polls" on public.polls;
create policy "admin update polls"
  on public.polls for update to authenticated using (true) with check (true);
drop policy if exists "admin delete polls" on public.polls;
create policy "admin delete polls"
  on public.polls for delete to authenticated using (true);

-- Саналууд (нэг client нэг асуулгад нэг санал)
create table if not exists public.poll_votes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  poll_id     uuid not null references public.polls(id) on delete cascade,
  option_idx  int not null,
  client      text not null
);
create unique index if not exists poll_votes_one_per_client on public.poll_votes (poll_id, client);

alter table public.poll_votes enable row level security;
-- Иргэн шууд уншиж/бичихгүй — зөвхөн доорх RPC-ээр. Админ дүнг харна.
drop policy if exists "admin read votes" on public.poll_votes;
create policy "admin read votes"
  on public.poll_votes for select to authenticated using (true);

-- Санал өгөх / сонголт солих. Хаагдсан асуулгад санал авахгүй.
-- Буцаах утга: сонголт тус бүрийн тоо, жишээ нь [12, 5, 3]
create or replace function public.poll_vote(p_poll uuid, p_option int, p_client text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_closes timestamptz;
  v_opts   int;
  v_counts jsonb;
begin
  select closes_at, jsonb_array_length(options) into v_closes, v_opts
  from polls where id = p_poll and published;
  if not found then
    raise exception 'poll not found';
  end if;
  if v_closes is not null and v_closes < now() then
    raise exception 'poll closed';
  end if;
  if p_option is null or p_option < 0 or p_option >= v_opts then
    raise exception 'bad option';
  end if;
  if p_client is null or length(trim(p_client)) < 6 then
    raise exception 'bad client';
  end if;

  insert into poll_votes (poll_id, option_idx, client)
  values (p_poll, p_option, p_client)
  on conflict (poll_id, client)
  do update set option_idx = excluded.option_idx, created_at = now();

  select coalesce(jsonb_agg(t.cnt order by t.idx), '[]'::jsonb) into v_counts
  from (
    select gs.idx, count(pv.id) as cnt
    from generate_series(0, v_opts - 1) as gs(idx)
    left join poll_votes pv on pv.poll_id = p_poll and pv.option_idx = gs.idx
    group by gs.idx
  ) t;
  return v_counts;
end;
$$;
grant execute on function public.poll_vote(uuid, int, text) to anon, authenticated;

-- Бүх нийтэлсэн асуулгын дүн (сонголт тус бүрээр)
create or replace function public.poll_results()
returns table (poll_id uuid, option_idx int, cnt bigint)
language sql security definer set search_path = public
as $$
  select pv.poll_id, pv.option_idx, count(*)::bigint
  from poll_votes pv
  join polls p on p.id = pv.poll_id
  where p.published = true
  group by pv.poll_id, pv.option_idx
$$;
grant execute on function public.poll_results() to anon, authenticated;

-- ============================================================
--  "Success" гарвал бэлэн. Админ → Санал асуулга табаас үүсгэнэ.
--  Асуулга байхгүй үед нүүрэн дэх хэсэг автоматаар нуугдана.
-- ============================================================
