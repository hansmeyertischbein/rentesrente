-- Lagrede spill i «Overfør»: ett spill per bruker. Hver bruker kan bare lese og skrive sitt eget.
create table if not exists public.spill (
  bruker uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null check (pg_column_size(data) < 200000),
  oppdatert timestamptz not null default now()
);

alter table public.spill enable row level security;

revoke all on public.spill from anon;
grant select, insert, update on public.spill to authenticated;

create policy "les eget spill" on public.spill for select to authenticated
  using ((select auth.uid()) = bruker);
create policy "lag eget spill" on public.spill for insert to authenticated
  with check ((select auth.uid()) = bruker);
create policy "endre eget spill" on public.spill for update to authenticated
  using ((select auth.uid()) = bruker) with check ((select auth.uid()) = bruker);

create or replace function public.sett_oppdatert() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.oppdatert := now();
  return new;
end $$;

create trigger spill_oppdatert before update on public.spill
  for each row execute function public.sett_oppdatert();

-- Brukeren kan slette sin egen konto. Spillet slettes med den.
create or replace function public.slett_meg() returns void
language sql security definer set search_path = '' as $$
  delete from auth.users where id = auth.uid();
$$;

revoke all on function public.slett_meg() from public, anon;
grant execute on function public.slett_meg() to authenticated;
