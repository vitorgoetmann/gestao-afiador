create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text not null,
  endereco text not null default '',
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.afiacoes (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  tipo_ferramenta text not null,
  outro_tipo text not null default '',
  valor numeric(12,2) not null,
  forma_pagamento text not null,
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clientes_nome on public.clientes using btree (lower(nome));
create index if not exists idx_afiacoes_cliente_id on public.afiacoes (cliente_id);
create index if not exists idx_afiacoes_created_at on public.afiacoes (created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_clientes_updated_at on public.clientes;
create trigger trg_clientes_updated_at
before update on public.clientes
for each row execute function public.set_updated_at();

drop trigger if exists trg_afiacoes_updated_at on public.afiacoes;
create trigger trg_afiacoes_updated_at
before update on public.afiacoes
for each row execute function public.set_updated_at();

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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.users enable row level security;
alter table public.clientes enable row level security;
alter table public.afiacoes enable row level security;

drop policy if exists "Users can read own profile" on public.users;
create policy "Users can read own profile"
on public.users for select
using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.users;
create policy "Users can update own profile"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.users;
create policy "Users can insert own profile"
on public.users for insert
with check (auth.uid() = id);

drop policy if exists "Authenticated can manage clientes" on public.clientes;
create policy "Authenticated can manage clientes"
on public.clientes
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated can manage afiacoes" on public.afiacoes;
create policy "Authenticated can manage afiacoes"
on public.afiacoes
for all
to authenticated
using (true)
with check (true);
