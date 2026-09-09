import { supabase } from '@/lib/supabase';
import type { AfiacaoComCliente } from '@/types/domain';
import { format, startOfMonth, startOfWeek } from 'date-fns';

export type ReportFilters = {
  period: 'today' | 'week' | 'month' | 'custom';
  clienteId: string;
  formaPagamento: string;
  ferramenta: string;
  from: string;
  to: string;
};

export async function fetchRelatorios(filters: ReportFilters) {
  let query = supabase.from('afiacoes').select('*, clientes(id, nome, telefone)').order('created_at', { ascending: false });

  if (filters.clienteId) query = query.eq('cliente_id', filters.clienteId);
  if (filters.formaPagamento) query = query.eq('forma_pagamento', filters.formaPagamento);
  if (filters.ferramenta) query = query.eq('tipo_ferramenta', filters.ferramenta);
  const today = format(new Date(), 'yyyy-MM-dd');
  const periodStart = filters.period === 'today'
    ? today
    : filters.period === 'week'
      ? format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
      : filters.period === 'month'
        ? format(startOfMonth(new Date()), 'yyyy-MM-dd')
        : filters.from;
  const periodEnd = filters.period === 'custom' ? filters.to : today;

  if (periodStart && periodEnd) {
    query = query.gte('data_afiacao', periodStart).lte('data_afiacao', periodEnd);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AfiacaoComCliente[];
}
