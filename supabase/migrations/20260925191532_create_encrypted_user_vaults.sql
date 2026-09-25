create table if not exists public.user_vaults (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null,
  revision bigint not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint payload_format check (
    jsonb_typeof(payload) = 'object'
    and payload->>'v' = '1'
    and jsonb_typeof(payload->'salt') = 'string'
    and jsonb_typeof(payload->'iv') = 'string'
    and jsonb_typeof(payload->'ciphertext') = 'string'
  )
);
alter table public.user_vaults enable row level security;
create policy "Owners read their vault" on public.user_vaults for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners create their vault" on public.user_vaults for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Owners update their vault" on public.user_vaults for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Owners delete their vault" on public.user_vaults for delete to authenticated using ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.user_vaults to authenticated;
revoke all on public.user_vaults from anon;
