alter table public.afiacoes
add column if not exists data_afiacao date not null default current_date;

create index if not exists idx_afiacoes_data_afiacao on public.afiacoes (data_afiacao desc);
