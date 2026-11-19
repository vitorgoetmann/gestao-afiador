create table if not exists public.despesas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  data_despesa date not null default current_date,
  motivo text not null,
  valor numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'despesas_motivo_nonblank') then
    alter table public.despesas add constraint despesas_motivo_nonblank check (length(trim(motivo)) > 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'despesas_valor_nonnegative') then
    alter table public.despesas add constraint despesas_valor_nonnegative check (valor >= 0);
  end if;
end $$;

create index if not exists idx_despesas_owner_id on public.despesas(owner_id);
create index if not exists idx_despesas_data_despesa on public.despesas(data_despesa desc);

drop trigger if exists trg_despesas_updated_at on public.despesas;
create trigger trg_despesas_updated_at
before update on public.despesas
for each row execute function public.set_updated_at();

alter table public.despesas enable row level security;

revoke all on public.despesas from anon;
grant select, insert, update, delete on public.despesas to authenticated;

drop policy if exists "Owners can manage despesas" on public.despesas;
create policy "Owners can manage despesas"
on public.despesas for all to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());
