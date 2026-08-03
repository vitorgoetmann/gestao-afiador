import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import { CalendarDays, Coins, HandCoins, ReceiptText, Users, Scissors, ChartColumn, Wallet } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/common/EmptyState';
import { fetchDashboardData } from '@/services/dashboardService';
import { formatCurrency } from '@/utils/format';
import { useMemo } from 'react';

const COLORS = ['#0f7a3b', '#16a34a', '#22c55e', '#4ade80', '#86efac'];

export function DashboardPage() {
  const { data, isLoading, isError, error } = useQuery({ queryKey: ['dashboard'], queryFn: fetchDashboardData });

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

  if (isLoading) return <Loading label="Carregando dashboard" />;
  if (isError) return <EmptyState title="Erro ao carregar dashboard" description={error instanceof Error ? error.message : 'Falha inesperada'} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Visão operacional com faturamento, volume de clientes e comportamento de receitas."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Faturamento Total" value={formatCurrency(data?.stats.faturamentoTotal ?? 0)} icon={<Coins className="h-5 w-5" />} accent />
        <StatCard title="Hoje" value={formatCurrency(data?.stats.faturamentoHoje ?? 0)} icon={<CalendarDays className="h-5 w-5" />} />
        <StatCard title="Semana" value={formatCurrency(data?.stats.faturamentoSemana ?? 0)} icon={<HandCoins className="h-5 w-5" />} />
        <StatCard title="Mês" value={formatCurrency(data?.stats.faturamentoMes ?? 0)} icon={<ReceiptText className="h-5 w-5" />} />
        <StatCard title="Quantidade de Clientes" value={`${data?.stats.clientes ?? 0}`} icon={<Users className="h-5 w-5" />} />
        <StatCard title="Quantidade de Afiações" value={`${data?.stats.afiacoes ?? 0}`} icon={<Scissors className="h-5 w-5" />} />
        <StatCard title="Ticket Médio" value={formatCurrency(data?.stats.ticketMedio ?? 0)} icon={<ChartColumn className="h-5 w-5" />} />
        <StatCard title="Operação Ativa" value="100%" icon={<Wallet className="h-5 w-5" />} />
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

        <Card>
          <CardHeader>
            <CardTitle>Gráfico diário</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => formatCurrency(Number(value)).replace(',00', '')} />
                <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                <Line type="monotone" dataKey="valor" stroke="#16a34a" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}