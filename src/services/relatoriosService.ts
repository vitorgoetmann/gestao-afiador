import { supabase } from '@/lib/supabase';
import type { AfiacaoComCliente } from '@/types/domain';

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
  if (filters.period === 'custom' && filters.from && filters.to) {
    query = query.gte('created_at', filters.from).lte('created_at', filters.to);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AfiacaoComCliente[];
}