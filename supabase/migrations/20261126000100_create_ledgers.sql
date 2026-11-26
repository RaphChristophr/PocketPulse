create table public.pocketpulse_ledgers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  revision uuid not null,
  snapshot jsonb not null,
  constraint ledger_shape check (
    jsonb_typeof(snapshot) = 'object'
    and snapshot @> '{"schemaVersion": 1, "demo": false}'
    and snapshot ?& array['accounts', 'categories', 'transactions', 'monthlyBudgets', 'weeklyBudgets']
    and jsonb_typeof(snapshot -> 'accounts') = 'array'
    and jsonb_typeof(snapshot -> 'categories') = 'array'
    and jsonb_typeof(snapshot -> 'transactions') = 'array'
    and jsonb_typeof(snapshot -> 'monthlyBudgets') = 'array'
    and jsonb_typeof(snapshot -> 'weeklyBudgets') = 'array'
  )
);

alter table public.pocketpulse_ledgers enable row level security;

revoke all on public.pocketpulse_ledgers from public, anon, authenticated;
grant select, insert, update on public.pocketpulse_ledgers to authenticated;

create policy "Read own ledger"
on public.pocketpulse_ledgers for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Create own ledger"
on public.pocketpulse_ledgers for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Update own ledger"
on public.pocketpulse_ledgers for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
