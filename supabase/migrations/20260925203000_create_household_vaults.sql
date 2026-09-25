-- One joint encrypted vault per two-person household. The invited address must
-- belong to a confirmed Supabase Auth user (Google or confirmed email sign-in).
create table public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  invite_email text not null check (invite_email = lower(btrim(invite_email)) and position('@' in invite_email) > 1),
  created_at timestamptz not null default now(),
  unique (owner_id)
);
create index households_invite_email_idx on public.households (invite_email);

create table public.household_vaults (
  household_id uuid primary key references public.households(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint household_payload_format check (
    jsonb_typeof(payload) = 'object'
    and payload->>'v' = '1'
    and jsonb_typeof(payload->'salt') = 'string'
    and jsonb_typeof(payload->'iv') = 'string'
    and jsonb_typeof(payload->'ciphertext') = 'string'
  )
);

alter table public.households enable row level security;
alter table public.household_vaults enable row level security;
revoke all on public.households, public.household_vaults from anon, authenticated;
grant select, insert, delete, update (name, invite_email) on public.households to authenticated;
grant select, insert, delete, update (payload, revision, updated_at) on public.household_vaults to authenticated;

create policy "Members see household details" on public.households
  for select to authenticated using (
    owner_id = (select auth.uid())
    or invite_email = lower((select auth.jwt()->>'email'))
  );
create policy "Owners create households" on public.households
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "Owners update household details" on public.households
  for update to authenticated using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));
create policy "Owners remove households" on public.households
  for delete to authenticated using (owner_id = (select auth.uid()));

create policy "Members read encrypted household vault" on public.household_vaults
  for select to authenticated using (
    exists (select 1 from public.households h where h.id = household_id)
  );
create policy "Owners create encrypted household vault" on public.household_vaults
  for insert to authenticated with check (
    exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
  );
create policy "Members update encrypted household vault" on public.household_vaults
  for update to authenticated using (
    exists (select 1 from public.households h where h.id = household_id)
  ) with check (
    exists (select 1 from public.households h where h.id = household_id)
  );
create policy "Owners remove encrypted household vault" on public.household_vaults
  for delete to authenticated using (
    exists (select 1 from public.households h where h.id = household_id and h.owner_id = (select auth.uid()))
  );
