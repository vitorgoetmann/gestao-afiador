import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable } from '@/components/common/DataTable';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { fetchClientes } from '@/services/clientesService';
import { fetchRelatorios, type ReportFilters } from '@/services/relatoriosService';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { formatCurrency, formatDateOnly, formatDateTime } from '@/utils/format';
import { Search } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import type { InputHTMLAttributes } from 'react';
import { writeStorage } from '@/utils/storage';
import { cn } from '@/lib/utils';

const defaultFilters: ReportFilters = {
  period: 'month',
  clienteId: '',
  formaPagamento: '',
  ferramenta: '',
  from: '',
  to: '',
};

export function RelatoriosPage() {
  const [filters, setFilters] = useLocalStorage<ReportFilters>('vibe-relatorio-filtros', defaultFilters);
  const [query, setQuery] = useState('');
  const queryClient = useQueryClient();
  const { data: clientes = [] } = useQuery({ queryKey: ['clientes-report'], queryFn: () => fetchClientes() });

  const { data, isLoading, isError } = useQuery({ queryKey: ['relatorios', filters], queryFn: () => fetchRelatorios(filters) });

  const filtered = useMemo(() => (data ?? []).filter((item) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [item.forma_pagamento, item.tipo_ferramenta, item.outro_tipo, item.clientes?.nome].some((value) => value?.toLowerCase().includes(term));
  }), [data, query]);

  const total = filtered.reduce((sum, item) => sum + Number(item.valor), 0);

  function updateFilters(next: Partial<ReportFilters>) {
    const merged = { ...filters, ...next };
    setFilters(merged);
    writeStorage('vibe-relatorio-filtros', merged);
    queryClient.invalidateQueries({ queryKey: ['relatorios'] });
  }

  if (isError) return <EmptyState title="Erro ao carregar relatórios" description="Não foi possível consultar os dados agora." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Filtre por período, cliente, ferramenta e forma de pagamento para analisar a operação."
        actions={<div className="w-full sm:w-80"><SearchInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Pesquisar nos relatórios" /></div>}
      />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <Select value={filters.period} onChange={(event) => updateFilters({ period: event.target.value as ReportFilters['period'] })}>
            <option value="today">Hoje</option>
            <option value="week">Semana</option>
            <option value="month">Mês</option>
            <option value="custom">Período personalizado</option>
          </Select>
          <Select value={filters.clienteId} onChange={(event) => updateFilters({ clienteId: event.target.value })}>
            <option value="">Todos os clientes</option>
            {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
          </Select>
          <Select value={filters.formaPagamento} onChange={(event) => updateFilters({ formaPagamento: event.target.value })}>
            <option value="">Todas as formas</option>
            <option value="Pix">Pix</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Carteira">Carteira</option>
          </Select>
          <Select value={filters.ferramenta} onChange={(event) => updateFilters({ ferramenta: event.target.value })}>
            <option value="">Todas as ferramentas</option>
            <option value="Facas">Facas</option>
            <option value="Tesouras">Tesouras</option>
            <option value="Alicates de unha">Alicates de unha</option>
            <option value="Alicates de corte">Alicates de corte</option>
            <option value="Outros">Outros</option>
          </Select>
          <Input type="date" value={filters.from} onChange={(event) => updateFilters({ from: event.target.value })} disabled={filters.period !== 'custom'} />
          <Input type="date" value={filters.to} onChange={(event) => updateFilters({ to: event.target.value })} disabled={filters.period !== 'custom'} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Resultados</p><p className="mt-2 text-2xl font-semibold">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Faturamento filtrado</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(total)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Média</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(filtered.length ? total / filtered.length : 0)}</p></CardContent></Card>
      </div>

      <DataTable title="Relatório detalhado" description="Registros retornados pelos filtros aplicados." loading={isLoading} empty={!filtered.length}>
        <Table className="hidden md:table">
          <TableHead>
            <TableRow>
              <TableHeader>Cliente</TableHeader>
              <TableHeader>Ferramenta</TableHeader>
              <TableHeader>Pagamento</TableHeader>
              <TableHeader>Valor</TableHeader>
              <TableHeader>Data</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.clientes?.nome ?? '-'}</TableCell>
                <TableCell>{item.tipo_ferramenta === 'Outros' ? item.outro_tipo || 'Outros' : item.tipo_ferramenta}</TableCell>
                <TableCell>{item.forma_pagamento}</TableCell>
                <TableCell>{formatCurrency(Number(item.valor))}</TableCell>
                <TableCell>{formatDateOnly(item.data_afiacao ?? item.created_at)}</TableCell>
              </TableRow>
            ))}
            {!filtered.length ? <TableEmpty colSpan={5}>Nenhum resultado para os filtros atuais.</TableEmpty> : null}
          </TableBody>
        </Table>
        <div className="grid gap-3 md:hidden p-4 sm:p-6">
          {filtered.map((item) => (
            <Card key={item.id} className="border-border/80 bg-background/80">
              <div className="space-y-3 p-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{item.clientes?.nome ?? '-'}</p>
                  <p className="text-xs text-muted-foreground">{item.forma_pagamento}</p>
                </div>
                <div className="grid gap-2 text-sm">
                  <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Ferramenta</p>
                    <p className="mt-1 break-words">{item.tipo_ferramenta === 'Outros' ? item.outro_tipo || 'Outros' : item.tipo_ferramenta}</p>
                  </div>
                  <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Observações</p>
                    <p className={cn('mt-1 break-words', !item.observacoes && 'text-muted-foreground')}>{item.observacoes || 'Sem observações'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Valor</p>
                      <p className="mt-1 font-medium">{formatCurrency(Number(item.valor))}</p>
                    </div>
                    <div className="rounded-2xl bg-secondary/40 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Data</p>
                      <p className="mt-1 text-xs leading-5">{formatDateTime(item.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DataTable>
    </div>
  );
}

function SearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input {...props} className="pl-11" />
    </div>
  );
}
