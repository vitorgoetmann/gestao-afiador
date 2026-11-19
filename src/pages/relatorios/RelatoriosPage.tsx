import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { EmptyState } from '@/components/common/EmptyState';
import { DataTable } from '@/components/common/DataTable';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { fetchClientes } from '@/services/clientesService';
import { fetchMateriais } from '@/services/materiaisService';
import { fetchRelatorios, type ReportFilters } from '@/services/relatoriosService';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { formatCurrency, formatDateOnly } from '@/utils/format';
import { shareOrDownloadReportPdf } from '@/utils/reportPdf';
import { cn } from '@/lib/utils';

type ReportSort = 'newest' | 'oldest' | 'highest' | 'lowest' | 'client';

const defaultFilters: ReportFilters = {
  period: 'month',
  clienteId: '',
  formaPagamento: '',
  ferramenta: '',
  from: '',
  to: '',
};

const periodOptions: Array<{ key: ReportFilters['period']; label: string }> = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
  { key: 'custom', label: 'Personalizado' },
];

function itemDescription(item: Awaited<ReturnType<typeof fetchRelatorios>>[number]) {
  if (item.itens?.length) return item.itens.map((entry) => `${entry.quantidade}x ${entry.nome}`).join(', ');
  return item.tipo_ferramenta === 'Outros' ? item.outro_tipo || 'Outros' : item.tipo_ferramenta;
}

export function RelatoriosPage() {
  const [filters, setFilters] = useLocalStorage<ReportFilters>('vibe-relatorio-filtros', defaultFilters);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useLocalStorage<ReportSort>('vibe-relatorio-ordenacao', 'newest');
  const [exporting, setExporting] = useState(false);
  const { data: clientes = [] } = useQuery({ queryKey: ['clientes-report'], queryFn: () => fetchClientes() });
  const { data: materiais = [] } = useQuery({ queryKey: ['materiais-report'], queryFn: () => fetchMateriais() });

  const { data, isLoading, isError } = useQuery({ queryKey: ['relatorios', filters], queryFn: () => fetchRelatorios(filters) });

  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('pt-BR');
    const rows = (data ?? []).filter((item) => (
      !term || [item.forma_pagamento, itemDescription(item), item.clientes?.nome, item.observacoes]
        .some((value) => value?.toLocaleLowerCase('pt-BR').includes(term))
    ));

    return rows.sort((left, right) => {
      const leftDate = left.data_afiacao ?? left.created_at;
      const rightDate = right.data_afiacao ?? right.created_at;
      if (sortBy === 'oldest') return leftDate.localeCompare(rightDate);
      if (sortBy === 'highest') return Number(right.valor) - Number(left.valor);
      if (sortBy === 'lowest') return Number(left.valor) - Number(right.valor);
      if (sortBy === 'client') return (left.clientes?.nome ?? '').localeCompare(right.clientes?.nome ?? '', 'pt-BR', { sensitivity: 'base' });
      return rightDate.localeCompare(leftDate);
    });
  }, [data, query, sortBy]);

  const total = filtered.reduce((sum, item) => sum + Number(item.valor), 0);

  function updateFilters(next: Partial<ReportFilters>) {
    setFilters({ ...filters, ...next });
  }

  const periodLabel = filters.period === 'today'
    ? 'Hoje'
    : filters.period === 'week'
      ? 'Semana atual'
      : filters.period === 'month'
        ? 'Mês atual'
        : filters.period === 'year'
          ? 'Ano atual'
          : filters.from && filters.to
            ? `${formatDateOnly(filters.from)} a ${formatDateOnly(filters.to)}`
            : 'Período personalizado';

  const filtersLabel = [
    clientes.find((cliente) => cliente.id === filters.clienteId)?.nome,
    filters.formaPagamento,
    filters.ferramenta,
    query.trim() ? `Busca: ${query.trim()}` : '',
  ].filter(Boolean).join(' • ') || 'Todos os registros do período';

  async function handleExportPdf() {
    if (!filtered.length) {
      toast.error('Não há registros para gerar o relatório.');
      return;
    }
    setExporting(true);
    try {
      await shareOrDownloadReportPdf(filtered, { periodLabel, filtersLabel });
      toast.success('Relatório gerado com sucesso');
    } catch (exportError) {
      if (exportError instanceof DOMException && exportError.name === 'AbortError') return;
      toast.error('Não foi possível gerar o relatório.');
    } finally {
      setExporting(false);
    }
  }

  if (isError) return <EmptyState title="Erro ao carregar relatórios" description="Não foi possível consultar os dados agora." />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Analise os serviços e gere um PDF pronto para compartilhar."
        actions={(
          <>
            <div className="w-full sm:w-72"><SearchInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar cliente ou serviço" /></div>
            <Button type="button" onClick={handleExportPdf} disabled={exporting || !filtered.length}>
              <Download className="mr-2 h-4 w-4" />{exporting ? 'Gerando...' : 'Baixar relatório'}
            </Button>
          </>
        )}
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>Filtrar relatório</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Escolha o período e refine apenas se precisar.</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={() => { setFilters(defaultFilters); setQuery(''); }}>
            <RotateCcw className="mr-2 h-4 w-4" />Limpar
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-1 rounded-2xl border border-border bg-secondary/25 p-1 sm:grid-cols-5" role="tablist" aria-label="Período do relatório">
            {periodOptions.map((period) => (
              <button
                key={period.key}
                type="button"
                role="tab"
                aria-selected={filters.period === period.key}
                onClick={() => updateFilters({ period: period.key })}
                className={cn(
                  'min-h-10 rounded-xl px-2 text-xs font-medium transition-colors sm:text-sm',
                  filters.period === period.key ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-background hover:text-foreground',
                  period.key === 'custom' && 'col-span-2 sm:col-span-1',
                )}
              >
                {period.label}
              </button>
            ))}
          </div>

          {filters.period === 'custom' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label htmlFor="report-from">Data inicial</Label><Input id="report-from" type="date" value={filters.from} onChange={(event) => updateFilters({ from: event.target.value })} /></div>
              <div className="space-y-1.5"><Label htmlFor="report-to">Data final</Label><Input id="report-to" type="date" value={filters.to} onChange={(event) => updateFilters({ to: event.target.value })} /></div>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="report-client">Cliente</Label>
              <Select id="report-client" value={filters.clienteId} onChange={(event) => updateFilters({ clienteId: event.target.value })}>
                <option value="">Todos os clientes</option>
                {clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-payment">Pagamento</Label>
              <Select id="report-payment" value={filters.formaPagamento} onChange={(event) => updateFilters({ formaPagamento: event.target.value })}>
                <option value="">Todas as formas</option>
                <option value="Pix">Pix</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão de débito">Cartão de débito</option>
                <option value="Cartão de crédito">Cartão de crédito</option>
                <option value="Boleto">Boleto</option>
                <option value="Carteira">Carteira</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="report-material">Material</Label>
              <Select id="report-material" value={filters.ferramenta} onChange={(event) => updateFilters({ ferramenta: event.target.value })}>
                <option value="">Todos os materiais</option>
                {materiais.map((material) => <option key={material.id} value={material.nome}>{material.nome}</option>)}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Serviços</p><p className="mt-2 text-2xl font-semibold">{filtered.length}</p></CardContent></Card>
        <Card className="border-primary/20 bg-primary/5"><CardContent className="p-5"><p className="text-sm text-muted-foreground">Total no período</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(total)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Ticket médio</p><p className="mt-2 text-2xl font-semibold">{formatCurrency(filtered.length ? total / filtered.length : 0)}</p></CardContent></Card>
      </div>

      <DataTable
        title="Serviços do relatório"
        description={`${periodLabel} • ${filtersLabel}`}
        loading={isLoading}
        empty={!filtered.length}
        actions={(
          <Select aria-label="Ordenar relatório" value={sortBy} onChange={(event) => setSortBy(event.target.value as ReportSort)} className="sm:min-w-52">
            <option value="newest">Mais recentes</option>
            <option value="oldest">Mais antigos</option>
            <option value="highest">Maior valor</option>
            <option value="lowest">Menor valor</option>
            <option value="client">Cliente: A–Z</option>
          </Select>
        )}
      >
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
                <TableCell>{itemDescription(item)}</TableCell>
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
                    <p className="mt-1 break-words">{itemDescription(item)}</p>
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
                      <p className="mt-1 text-xs leading-5">{formatDateOnly(item.data_afiacao ?? item.created_at)}</p>
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
