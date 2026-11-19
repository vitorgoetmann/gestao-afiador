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

create index if not exists idx_clientes_owner_id on public.clientes(owner_id);
create index if not exists idx_materiais_owner_id on public.materiais(owner_id);
create index if not exists idx_afiacoes_owner_id on public.afiacoes(owner_id);

create or replace function public.validate_afiacao_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  client_owner uuid;
begin
  select owner_id into client_owner from public.clientes where id = new.cliente_id;
  if client_owner is null or client_owner <> new.owner_id then
    raise exception 'Cliente invalido para o proprietario atual';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_afiacoes_owner on public.afiacoes;
create trigger trg_afiacoes_owner
before insert or update of cliente_id, owner_id on public.afiacoes
for each row execute function public.validate_afiacao_owner();

revoke execute on function public.validate_afiacao_owner() from public;

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
