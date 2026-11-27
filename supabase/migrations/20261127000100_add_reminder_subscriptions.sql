create table public.pocketpulse_reminders (
  endpoint text primary key check (length(endpoint) between 1 and 2000),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  p256dh text not null check (p256dh ~ '^[A-Za-z0-9_-]{86,90}$'),
  auth_key text not null check (auth_key ~ '^[A-Za-z0-9_-]{22,24}$'),
  language text not null check (language in ('id', 'en')),
  last_sent_on date
);

alter table public.pocketpulse_reminders enable row level security;
revoke all on public.pocketpulse_reminders from public, anon, authenticated;
grant select (endpoint, user_id, language), insert (endpoint, p256dh, auth_key, language),
  update (p256dh, auth_key, language), delete on public.pocketpulse_reminders to authenticated;
grant all on public.pocketpulse_reminders to service_role;

create policy "Read own reminders" on public.pocketpulse_reminders for select to authenticated
using ((select auth.uid()) = user_id);
create policy "Subscribe own device" on public.pocketpulse_reminders for insert to authenticated
with check ((select auth.uid()) = user_id);
create policy "Update own device" on public.pocketpulse_reminders for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Unsubscribe own device" on public.pocketpulse_reminders for delete to authenticated
using ((select auth.uid()) = user_id);
