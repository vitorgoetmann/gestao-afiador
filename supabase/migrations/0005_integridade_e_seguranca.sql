do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'afiacoes_valor_nonnegative') then
    alter table public.afiacoes add constraint afiacoes_valor_nonnegative check (valor >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'afiacoes_subtotal_nonnegative') then
    alter table public.afiacoes add constraint afiacoes_subtotal_nonnegative check (subtotal >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'afiacoes_desconto_nonnegative') then
    alter table public.afiacoes add constraint afiacoes_desconto_nonnegative check (desconto >= 0);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'afiacoes_forma_pagamento_allowed') then
    alter table public.afiacoes add constraint afiacoes_forma_pagamento_allowed check (forma_pagamento in ('Pix', 'Dinheiro', 'Carteira'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'materiais_nome_nonblank') then
    alter table public.materiais add constraint materiais_nome_nonblank check (length(trim(nome)) > 0);
  end if;
end;
$$;

revoke all on public.users from anon;
revoke all on public.clientes from anon;
revoke all on public.materiais from anon;
revoke all on public.afiacoes from anon;
