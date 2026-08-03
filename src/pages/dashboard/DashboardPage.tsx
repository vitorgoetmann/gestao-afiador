import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { CalendarDays, Coins, HandCoins, ReceiptText, Users, Scissors, ChevronLeft, ChevronRight } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/common/EmptyState';
import { fetchDashboardData } from '@/services/dashboardService';
import { formatCurrency } from '@/utils/format';

const COLORS = ['#0f7a3b', '#16a34a', '#22c55e', '#4ade80', '#86efac'];

export function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboardData });
  const revenueTrackRef = useRef<HTMLDivElement | null>(null);
  const [activeRevenueIndex, setActiveRevenueIndex] = useState(2);

  const charts = useMemo(() => {
    const afiacoes = data?.afiacoes ?? [];
    const byDay = new Map<string, number>();
    const byMonth = new Map<string, number>();
    const byPayment = new Map<string, number>();
    const byTool = new Map<string, number>();

    afiacoes.forEach((item) => {
      const date = new Date(item.created_at);
      const dayKey = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(date);
      const monthKey = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date);
      byDay.set(dayKey, (byDay.get(dayKey) || 0) + Number(item.valor));
      byMonth.set(monthKey, (byMonth.get(monthKey) || 0) + Number(item.valor));
      byPayment.set(item.forma_pagamento, (byPayment.get(item.forma_pagamento) || 0) + Number(item.valor));
      const tool = item.tipo_ferramenta === 'Outros' ? item.outro_tipo || 'Outros' : item.tipo_ferramenta;
      byTool.set(tool, (byTool.get(tool) || 0) + 1);
    });

    return {
      daily: Array.from(byDay.entries()).slice(-7).map(([name, valor]) => ({ name, valor })),
      monthly: Array.from(byMonth.entries()).slice(-6).map(([name, valor]) => ({ name, valor })),
      payments: Array.from(byPayment.entries()).map(([name, valor]) => ({ name, valor })),
      tools: Array.from(byTool.entries()).slice(0, 5).map(([name, valor]) => ({ name, valor })),
    };
  }, [data?.afiacoes]);

  const revenueSlides = useMemo(
    () => [
      { key: 'day', label: 'Faturamento do dia', value: data?.stats.faturamentoHoje ?? 0, icon: CalendarDays, accent: false },
      { key: 'week', label: 'Faturamento da semana', value: data?.stats.faturamentoSemana ?? 0, icon: HandCoins, accent: false },
      { key: 'month', label: 'Faturamento do mês', value: data?.stats.faturamentoMes ?? 0, icon: ReceiptText, accent: true },
      { key: 'year', label: 'Faturamento do ano', value: data?.stats.faturamentoAno ?? 0, icon: Coins, accent: false },
    ],
    [data?.stats],
  );

  useEffect(() => {
    const activeSlide = revenueTrackRef.current?.children.item(activeRevenueIndex) as HTMLElement | null;
    activeSlide?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }, [activeRevenueIndex]);

  function moveRevenue(direction: -1 | 1) {
    setActiveRevenueIndex((current) => {
      const nextIndex = Math.min(Math.max(current + direction, 0), revenueSlides.length - 1);
      return nextIndex;
    });
  }

  function handleRevenueScroll() {
    const container = revenueTrackRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    const containerCenter = container.scrollLeft + container.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;

    children.forEach((child, index) => {
      const childCenter = child.offsetLeft + child.offsetWidth / 2;
      const distance = Math.abs(childCenter - containerCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    setActiveRevenueIndex(closestIndex);
  }

  if (isLoading) return <Loading label="Carregando dashboard" />;
  if (isError) return <EmptyState title="Erro ao carregar dashboard" description={error instanceof Error ? error.message : 'Falha inesperada'} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão operacional com faturamento, volume de clientes e comportamento de receitas."
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Faturamento</p>
            <p className="text-xs text-muted-foreground">Deslize para trocar entre dia, semana, mês e ano.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="icon" onClick={() => moveRevenue(-1)} aria-label="Slide anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" onClick={() => moveRevenue(1)} aria-label="Próximo slide">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative">
          <div
            ref={revenueTrackRef}
            onScroll={handleRevenueScroll}
            className="scrollbar-thin flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {revenueSlides.map((slide, index) => {
              const Icon = slide.icon;
              return (
                <div key={slide.key} className="min-w-full snap-center">
                  <StatCard
                    title={slide.label}
                    value={formatCurrency(slide.value)}
                    icon={<Icon className="h-5 w-5" />}
                    accent={slide.accent}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard title="Faturamento Total" value={formatCurrency(data?.stats.faturamentoTotal ?? 0)} icon={<Coins className="h-5 w-5" />} accent />
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
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Line type="monotone" dataKey="valor" stroke="#0f7a3b" strokeWidth={3} dot={false} />
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
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
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
                <Tooltip />
                <Bar dataKey="valor" fill="#0f7a3b" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}