create table if not exists public.materiais (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor numeric(12,2) not null check (valor >= 0),
  observacoes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.afiacoes add column if not exists itens jsonb not null default '[]'::jsonb;
alter table public.afiacoes add column if not exists subtotal numeric(12,2) not null default 0;
alter table public.afiacoes add column if not exists desconto numeric(12,2) not null default 0;

update public.afiacoes set subtotal = valor where subtotal = 0 and itens = '[]'::jsonb;

create index if not exists idx_materiais_nome on public.materiais using btree (lower(nome));

drop trigger if exists trg_materiais_updated_at on public.materiais;
create trigger trg_materiais_updated_at
before update on public.materiais
for each row execute function public.set_updated_at();

alter table public.materiais enable row level security;
drop policy if exists "Authenticated can manage materiais" on public.materiais;
create policy "Authenticated can manage materiais"
on public.materiais for all to authenticated using (true) with check (true);
