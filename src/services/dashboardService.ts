import { supabase } from '@/lib/supabase';
import type { AfiacaoComCliente, Cliente, DashboardStats } from '@/types/domain';
import { inMonth, inToday, inWeek } from '@/utils/format';
import { parseISO } from 'date-fns';

export async function fetchDashboardData() {
  const [clientesResult, afiacoesResult] = await Promise.all([
    supabase.from('clientes').select('*').order('created_at', { ascending: false }),
    supabase.from('afiacoes').select('*, clientes(id, nome, telefone)').order('created_at', { ascending: false }),
  ]);

  if (clientesResult.error) throw clientesResult.error;
  if (afiacoesResult.error) throw afiacoesResult.error;

  const clientes = (clientesResult.data ?? []) as Cliente[];
  const afiacoes = (afiacoesResult.data ?? []) as AfiacaoComCliente[];

  const total = afiacoes.reduce((sum, item) => sum + Number(item.valor), 0);
  const today = afiacoes.filter((item) => inToday(item.data_afiacao ?? item.created_at)).reduce((sum, item) => sum + Number(item.valor), 0);
  const week = afiacoes.filter((item) => inWeek(item.data_afiacao ?? item.created_at)).reduce((sum, item) => sum + Number(item.valor), 0);
  const month = afiacoes.filter((item) => inMonth(item.data_afiacao ?? item.created_at)).reduce((sum, item) => sum + Number(item.valor), 0);
  const year = afiacoes
    .filter((item) => parseISO(item.data_afiacao ?? item.created_at).getFullYear() === new Date().getFullYear())
    .reduce((sum, item) => sum + Number(item.valor), 0);

  const stats: DashboardStats = {
    faturamentoTotal: total,
    faturamentoHoje: today,
    faturamentoSemana: week,
    faturamentoMes: month,
    faturamentoAno: year,
    clientes: clientes.length,
    afiacoes: afiacoes.length,
    ticketMedio: afiacoes.length ? total / afiacoes.length : 0,
  };

  return { clientes, afiacoes, stats };
}
