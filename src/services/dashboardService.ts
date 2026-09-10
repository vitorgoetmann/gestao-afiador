import { supabase } from '@/lib/supabase';
import type { AfiacaoComCliente, Cliente, DashboardStats, Despesa } from '@/types/domain';
import { inMonth, inToday, inWeek } from '@/utils/format';
import { parseISO } from 'date-fns';
import { getCurrentUserId } from '@/services/authService';

export async function fetchDashboardData() {
  const ownerId = await getCurrentUserId();
  const [clientesResult, afiacoesResult, despesasResult] = await Promise.all([
    supabase.from('clientes').select('*').eq('owner_id', ownerId).order('created_at', { ascending: false }),
    supabase.from('afiacoes').select('*, clientes(id, nome, telefone)').eq('owner_id', ownerId).order('created_at', { ascending: false }),
    supabase.from('despesas').select('*').eq('owner_id', ownerId).order('data_despesa', { ascending: false }),
  ]);

  if (clientesResult.error) throw clientesResult.error;
  if (afiacoesResult.error) throw afiacoesResult.error;
  if (despesasResult.error) throw despesasResult.error;

  const clientes = (clientesResult.data ?? []) as Cliente[];
  const afiacoes = (afiacoesResult.data ?? []) as AfiacaoComCliente[];
  const despesas = (despesasResult.data ?? []) as Despesa[];

  const receitaTotal = afiacoes.reduce((sum, item) => sum + Number(item.valor), 0);
  const despesasTotal = despesas.reduce((sum, item) => sum + Number(item.valor), 0);
  const total = receitaTotal - despesasTotal;
  const today = afiacoes.filter((item) => inToday(item.data_afiacao ?? item.created_at)).reduce((sum, item) => sum + Number(item.valor), 0)
    - despesas.filter((item) => inToday(item.data_despesa)).reduce((sum, item) => sum + Number(item.valor), 0);
  const week = afiacoes.filter((item) => inWeek(item.data_afiacao ?? item.created_at)).reduce((sum, item) => sum + Number(item.valor), 0)
    - despesas.filter((item) => inWeek(item.data_despesa)).reduce((sum, item) => sum + Number(item.valor), 0);
  const month = afiacoes.filter((item) => inMonth(item.data_afiacao ?? item.created_at)).reduce((sum, item) => sum + Number(item.valor), 0)
    - despesas.filter((item) => inMonth(item.data_despesa)).reduce((sum, item) => sum + Number(item.valor), 0);
  const year = afiacoes
    .filter((item) => parseISO(item.data_afiacao ?? item.created_at).getFullYear() === new Date().getFullYear())
    .reduce((sum, item) => sum + Number(item.valor), 0)
    - despesas
      .filter((item) => parseISO(item.data_despesa).getFullYear() === new Date().getFullYear())
      .reduce((sum, item) => sum + Number(item.valor), 0);

  const stats: DashboardStats = {
    faturamentoTotal: total,
    faturamentoHoje: today,
    faturamentoSemana: week,
    faturamentoMes: month,
    faturamentoAno: year,
    despesasTotal,
    clientes: clientes.length,
    afiacoes: afiacoes.length,
    ticketMedio: afiacoes.length ? receitaTotal / afiacoes.length : 0,
  };

  return { clientes, afiacoes, despesas, stats };
}
