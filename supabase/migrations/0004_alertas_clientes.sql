alter table public.clientes add column if not exists alerta_ativo boolean not null default false;
alter table public.clientes add column if not exists alerta_periodo_meses integer not null default 3;
alter table public.clientes add column if not exists alerta_ciente_em timestamptz;

alter table public.clientes drop constraint if exists clientes_alerta_periodo_meses_check;
alter table public.clientes add constraint clientes_alerta_periodo_meses_check check (alerta_periodo_meses > 0);
