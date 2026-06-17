-- ============================================================
--  Ц.Баатархүү — Коммент RLS засвар
--  Алдаа: коммент бичих/харах бодлого нь feedback хүснэгтээс
--  is_public-ийг шалгадаг ч anon хэрэглэгч feedback-ийг унших
--  эрхгүй тул шалгалт үргэлж худал болж байсан.
--  Шийдэл: SECURITY DEFINER функцээр RLS-ийг тойрч шалгана.
--  Supabase SQL Editor дотор хуулж "Run" дарна.
-- ============================================================

create or replace function public.is_public_feedback(p_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.feedback where id = p_id and is_public);
$$;
grant execute on function public.is_public_feedback(uuid) to anon, authenticated;

drop policy if exists "read comments on public" on public.feedback_comments;
create policy "read comments on public" on public.feedback_comments for select to anon, authenticated
  using (public.is_public_feedback(feedback_id));

drop policy if exists "comment on public" on public.feedback_comments;
create policy "comment on public" on public.feedback_comments for insert to anon, authenticated
  with check (char_length(btrim(body)) between 1 and 1000 and public.is_public_feedback(feedback_id));

-- "Success" гарвал коммент бичих/харах ажиллана.
