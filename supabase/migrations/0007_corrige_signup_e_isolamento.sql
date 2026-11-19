alter table public.users drop constraint if exists users_username_key;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, username, email)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'username'), ''), split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
  set username = excluded.username,
      email = excluded.email;
  return new;
end;
$$;

alter table public.clientes add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.materiais add column if not exists owner_id uuid references auth.users(id) on delete cascade;
alter table public.afiacoes add column if not exists owner_id uuid references auth.users(id) on delete cascade;

do $$
declare
  account_id uuid;
begin
  select id into account_id
  from auth.users
  order by created_at asc
  limit 1;

  if account_id is not null then
    update public.clientes set owner_id = account_id where owner_id is null;
    update public.materiais set owner_id = account_id where owner_id is null;
    update public.afiacoes set owner_id = account_id where owner_id is null;
  end if;
end;
$$;

alter table public.clientes alter column owner_id set not null;
alter table public.materiais alter column owner_id set not null;
alter table public.afiacoes alter column owner_id set not null;

alter table public.clientes enable row level security;
alter table public.materiais enable row level security;
alter table public.afiacoes enable row level security;

drop policy if exists "Authenticated can manage clientes" on public.clientes;
drop policy if exists "Owners can manage clientes" on public.clientes;
create policy "Owners can manage clientes"
on public.clientes for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Authenticated can manage materiais" on public.materiais;
drop policy if exists "Owners can manage materiais" on public.materiais;
create policy "Owners can manage materiais"
on public.materiais for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "Authenticated can manage afiacoes" on public.afiacoes;
drop policy if exists "Owners can manage afiacoes" on public.afiacoes;
create policy "Owners can manage afiacoes"
on public.afiacoes for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
