-- Evaluate the authenticated email once per statement in the membership policy.
alter policy "Members see household details" on public.households
  using (
    owner_id = (select auth.uid())
    or invite_email = lower(((select auth.jwt())->>'email'))
  );
