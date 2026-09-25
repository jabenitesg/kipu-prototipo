alter policy "Members see household details" on public.households
  using (
    owner_id = (select auth.uid())
    or invite_email = (select lower(auth.jwt()->>'email'))
  );
