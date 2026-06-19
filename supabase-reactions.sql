-- ============================================================
-- Эможи реакц (мэдээ/арга хэмжээ/тайлан/төсөл дэлгэрэнгүй хуудсанд)
-- Зочин нэг агуулгад 1 реакц өгнө (өөрчилж болно). Supabase → SQL Editor.
-- Дахин ажиллуулахад аюулгүй.
-- ============================================================

create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  item_type text not null,            -- 'news' | 'event' | 'report' | 'project'
  item_id   text not null,
  reaction  text not null,            -- 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry'
  client_id text not null,
  created_at timestamptz default now(),
  unique (item_type, item_id, client_id)
);
create index if not exists reactions_item_idx on public.reactions (item_type, item_id);

alter table public.reactions enable row level security;

-- Зочин (anon) реакцийн тоог унших боломжтой (RPC-ээр)
-- Шууд select хаалттай; зөвхөн доорх RPC-ээр ажиллана.
drop policy if exists "reactions noselect" on public.reactions;

-- Тоог буцаах
create or replace function public.reaction_counts(p_type text, p_item text)
returns table(reaction text, cnt bigint)
language sql security definer set search_path = public as $$
  select reaction, count(*)::bigint
  from public.reactions
  where item_type = p_type and item_id = p_item
  group by reaction;
$$;

-- Реакц өгөх/солих/болиулах (нэг зочин = 1 реакц)
create or replace function public.toggle_reaction(p_type text, p_item text, p_reaction text, p_client text)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if exists (
    select 1 from public.reactions
    where item_type = p_type and item_id = p_item and client_id = p_client and reaction = p_reaction
  ) then
    delete from public.reactions
    where item_type = p_type and item_id = p_item and client_id = p_client;
  else
    insert into public.reactions (item_type, item_id, reaction, client_id)
    values (p_type, p_item, p_reaction, p_client)
    on conflict (item_type, item_id, client_id)
    do update set reaction = excluded.reaction, created_at = now();
  end if;
end;
$$;

grant execute on function public.reaction_counts(text, text) to anon, authenticated;
grant execute on function public.toggle_reaction(text, text, text, text) to anon, authenticated;
