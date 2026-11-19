import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { ArrowDownRight, ArrowUpRight, Minus, Scissors, Users } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/common/EmptyState';
import { fetchDashboardData } from '@/services/dashboardService';
import { formatCurrency } from '@/utils/format';
import { differenceInMilliseconds, format, isWithinInterval, parseISO, startOfDay, startOfMonth, startOfWeek, startOfYear, subMilliseconds } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const CHART_COLORS = ['#2A5C8A', '#E76F51', '#F4A261', '#7B61A8', '#D1495B', '#5B8DB8'];
type RevenuePeriod = 'day' | 'week' | 'month' | 'year';

const REVENUE_PERIODS: Array<{ key: RevenuePeriod; label: string }> = [
  { key: 'day', label: 'Hoje' },
  { key: 'week', label: 'Semana' },
  { key: 'month', label: 'Mês' },
  { key: 'year', label: 'Ano' },
];

function getPeriodStart(period: RevenuePeriod, now: Date) {
  if (period === 'day') return startOfDay(now);
  if (period === 'week') return startOfWeek(now, { weekStartsOn: 1 });
  if (period === 'month') return startOfMonth(now);
  return startOfYear(now);
}

function normalizeToolName(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'faca' || normalized === 'facas') return 'Facas';
  if (normalized === 'tesoura' || normalized === 'tesouras') return 'Tesouras';
  if (normalized === 'alicate de unha' || normalized === 'alicates de unha') return 'Alicates de unha';
  if (normalized === 'alicate de corte' || normalized === 'alicates de corte') return 'Alicates de corte';
  return value.trim() || 'Outros';
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboardData });
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month');

  const finance = useMemo(() => {
    const now = new Date();
    const currentStart = getPeriodStart(revenuePeriod, now);
    const currentEnd = now;
    const elapsed = Math.max(differenceInMilliseconds(currentEnd, currentStart), 1);
    const previousEnd = subMilliseconds(currentStart, 1);
    const previousStart = new Date(previousEnd.getTime() - elapsed);
    const afiacoes = data?.afiacoes ?? [];
    const despesas = data?.despesas ?? [];
    const inRange = (value: string, start: Date, end: Date) => isWithinInterval(parseISO(value), { start, end });

    const currentServices = afiacoes.filter((item) => inRange(item.data_afiacao ?? item.created_at, currentStart, currentEnd));
    const currentExpenses = despesas.filter((item) => inRange(item.data_despesa, currentStart, currentEnd));
    const previousServices = afiacoes.filter((item) => inRange(item.data_afiacao ?? item.created_at, previousStart, previousEnd));
    const previousExpenses = despesas.filter((item) => inRange(item.data_despesa, previousStart, previousEnd));

    const entradas = currentServices.reduce((sum, item) => sum + Number(item.valor), 0);
    const saidas = currentExpenses.reduce((sum, item) => sum + Number(item.valor), 0);
    const lucro = entradas - saidas;
    const previousEntradas = previousServices.reduce((sum, item) => sum + Number(item.valor), 0);
    const previousSaidas = previousExpenses.reduce((sum, item) => sum + Number(item.valor), 0);
    const previousLucro = previousEntradas - previousSaidas;
    const change = previousLucro !== 0 ? ((lucro - previousLucro) / Math.abs(previousLucro)) * 100 : null;
    const lucroMedio = currentServices.length ? lucro / currentServices.length : 0;
    const periodLabel = revenuePeriod === 'day'
      ? format(now, "dd 'de' MMMM", { locale: ptBR })
      : `${format(currentStart, 'dd/MM/yyyy')} até ${format(currentEnd, 'dd/MM/yyyy')}`;

    return {
      lucro,
      change,
      lucroMedio,
      serviceCount: currentServices.length,
      periodLabel,
    };
  }, [data?.afiacoes, data?.despesas, revenuePeriod]);

  const charts = useMemo(() => {
    const afiacoes = data?.afiacoes ?? [];
    const despesas = data?.despesas ?? [];
    const byDay = new Map<string, number>();
    const byMonth = new Map<string, number>();
    const byPayment = new Map<string, number>();
    const byTool = new Map<string, number>();

    afiacoes.forEach((item) => {
      const date = parseISO(item.data_afiacao ?? item.created_at);
      const dayKey = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
      const monthKey = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date);
      byDay.set(dayKey, (byDay.get(dayKey) || 0) + Number(item.valor));
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + Number(item.valor));
      byPayment.set(item.forma_pagamento, (byPayment.get(item.forma_pagamento) || 0) + Number(item.valor));
    if (item.itens?.length) {
      item.itens.forEach((entry) => {
        const tool = normalizeToolName(entry.nome);
        byTool.set(tool, (byTool.get(tool) || 0) + Number(entry.quantidade || 1));
      });
    } else {
      const tool = normalizeToolName(item.tipo_ferramenta === 'Outros' ? item.outro_tipo || 'Outros' : item.tipo_ferramenta);
      byTool.set(tool, (byTool.get(tool) || 0) + 1);
    }
    });

    despesas.forEach((item) => {
      const date = parseISO(item.data_despesa);
      const dayKey = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
      const monthKey = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date);
      byDay.set(dayKey, (byDay.get(dayKey) || 0) - Number(item.valor));
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) - Number(item.valor));
    });

    return {
      daily: Array.from(byDay.entries()).slice(-7).map(([name, valor]) => ({ name, valor })),
      monthly: Array.from(byMonth.entries()).slice(-6).map(([name, valor]) => ({ name, valor })),
      payments: Array.from(byPayment.entries()).map(([name, valor]) => ({ name, valor })),
      tools: Array.from(byTool.entries()).slice(0, 5).map(([name, valor]) => ({ name, valor })),
    };
  }, [data?.afiacoes, data?.despesas]);

  if (isLoading) return <Loading label="Carregando dashboard" />;
  if (isError) return <EmptyState title="Erro ao carregar dashboard" description={error instanceof Error ? error.message : 'Falha inesperada'} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão operacional com faturamento, volume de clientes e comportamento de receitas."
      />

      <Card className="overflow-hidden border-primary/20">
        <CardContent className="p-4 sm:p-6">
          <div className="mx-auto grid w-full max-w-5xl gap-4">
            <div className="grid grid-cols-4 rounded-2xl border border-border bg-background p-1 shadow-sm" role="tablist" aria-label="Período do lucro">
              {REVENUE_PERIODS.map((period) => (
                <button
                  key={period.key}
                  type="button"
                  role="tab"
                  aria-selected={revenuePeriod === period.key}
                  onClick={() => setRevenuePeriod(period.key)}
                  className={cn(
                    'min-h-10 rounded-xl px-2 text-xs font-medium transition-colors sm:px-4 sm:text-sm',
                    revenuePeriod === period.key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                  )}
                >
                  {period.label}
                </button>
              ))}
            </div>

            <div className="overflow-hidden rounded-[1.5rem] bg-primary text-primary-foreground shadow-soft">
              <div className="relative p-5 sm:p-7">
                <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/10" />
                <div className="pointer-events-none absolute -bottom-20 right-16 h-32 w-32 rounded-full bg-white/5" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-primary-foreground/75">Lucro no período</p>
                      <p className="mt-1 text-xs text-primary-foreground/60">{finance.periodLabel}</p>
                    </div>
                    {finance.change === null ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-primary-foreground/75">
                        <Minus className="h-3.5 w-3.5" /> Sem comparação
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-medium">
                        {finance.change >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                        {finance.change >= 0 ? '+' : '-'}{Math.abs(finance.change).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
                      </span>
                    )}
                  </div>
                  <p className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{formatCurrency(finance.lucro)}</p>
                  <p className="mt-2 text-xs text-primary-foreground/65">comparado ao período anterior equivalente</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-secondary/35 p-4">
                <p className="text-xs text-muted-foreground">Serviços realizados</p>
                <p className="mt-1.5 text-2xl font-semibold tracking-tight">{finance.serviceCount}</p>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/35 p-4">
                <p className="text-xs text-muted-foreground">Lucro por serviço</p>
                <p className="mt-1.5 truncate text-xl font-semibold tracking-tight sm:text-2xl">{formatCurrency(finance.lucroMedio)}</p>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Quantidade de Clientes" value={`${data?.stats.clientes ?? 0}`} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Quantidade de Afiações" value={`${data?.stats.afiacoes ?? 0}`} icon={<Scissors className="h-5 w-5" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
        <Card>
          <CardHeader>
            <CardTitle>Gráfico mensal</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => formatCurrency(Number(value)).replace(',00', '')} />
                <Tooltip cursor={false} formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Line type="monotone" dataKey="valor" stroke="#2A5C8A" strokeWidth={3} dot={false} activeDot={{ fill: '#E76F51', stroke: '#ffffff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Formas de pagamento</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.payments} dataKey="valor" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                  {charts.payments.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip cursor={false} formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ferramentas mais afiadas</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.tools}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip cursor={false} />
                <Bar dataKey="valor" radius={[10, 10, 0, 0]}>
                  {charts.tools.map((entry, index) => <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
