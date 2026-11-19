import { supabase } from '@/lib/supabase';
import type { AfiacaoComCliente } from '@/types/domain';
import { format, startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { getCurrentUserId } from '@/services/authService';

export type ReportFilters = {
  period: 'today' | 'week' | 'month' | 'year' | 'custom';
  clienteId: string;
  formaPagamento: string;
  ferramenta: string;
  from: string;
  to: string;
};

export async function fetchRelatorios(filters: ReportFilters) {
  const ownerId = await getCurrentUserId();
  let query = supabase.from('afiacoes').select('*, clientes(id, nome, telefone)').eq('owner_id', ownerId).order('created_at', { ascending: false });

  if (filters.clienteId) query = query.eq('cliente_id', filters.clienteId);
  if (filters.formaPagamento) query = query.eq('forma_pagamento', filters.formaPagamento);
  const today = format(new Date(), 'yyyy-MM-dd');
  const periodStart = filters.period === 'today'
    ? today
    : filters.period === 'week'
      ? format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      : filters.period === 'month'
        ? format(startOfMonth(new Date()), 'yyyy-MM-dd')
        : filters.period === 'year'
          ? format(startOfYear(new Date()), 'yyyy-MM-dd')
          : filters.from;
  const periodEnd = filters.period === 'custom' ? filters.to : today;

  if (periodStart && periodEnd) {
    query = query.gte('data_afiacao', periodStart).lte('data_afiacao', periodEnd);
  }

  const { data, error } = await query;
  if (error) throw error;
  const rows = data as AfiacaoComCliente[];
  if (!filters.ferramenta) return rows;

  const material = filters.ferramenta.toLocaleLowerCase('pt-BR');
  return rows.filter((item) => {
    if (item.itens?.some((entry) => entry.nome.toLocaleLowerCase('pt-BR') === material)) return true;
    const legacyName = item.tipo_ferramenta === 'Outros' ? item.outro_tipo : item.tipo_ferramenta;
    return legacyName.toLocaleLowerCase('pt-BR').includes(material);
  });
}
