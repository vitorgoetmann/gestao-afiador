import { supabase } from '@/lib/supabase';
import type { Afiacao, AfiacaoComCliente } from '@/types/domain';
import { sanitizeText } from '@/utils/format';

export type AfiacaoPayload = Omit<Afiacao, 'id' | 'created_at' | 'updated_at'>;

export async function fetchAfiacoes(search = '') {
  let query = supabase
    .from('afiacoes')
    .select('*, clientes(id, nome, telefone)')
    .order('created_at', { ascending: false });

  if (search.trim()) {
    query = query.or(`tipo_ferramenta.ilike.%${search.trim()}%,outro_tipo.ilike.%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AfiacaoComCliente[];
}

export async function createAfiacao(payload: AfiacaoPayload) {
  const { data, error } = await supabase
    .from('afiacoes')
    .insert({
      cliente_id: payload.cliente_id,
      tipo_ferramenta: sanitizeText(payload.tipo_ferramenta),
      outro_tipo: sanitizeText(payload.outro_tipo),
      valor: payload.valor,
      forma_pagamento: sanitizeText(payload.forma_pagamento),
      observacoes: sanitizeText(payload.observacoes),
    })
    .select('*, clientes(id, nome, telefone)')
    .single();

  if (error) throw error;
  return data as AfiacaoComCliente;
}

export async function updateAfiacao(id: string, payload: AfiacaoPayload) {
  const { data, error } = await supabase
    .from('afiacoes')
    .update({
      cliente_id: payload.cliente_id,
      tipo_ferramenta: sanitizeText(payload.tipo_ferramenta),
      outro_tipo: sanitizeText(payload.outro_tipo),
      valor: payload.valor,
      forma_pagamento: sanitizeText(payload.forma_pagamento),
      observacoes: sanitizeText(payload.observacoes),
    })
    .eq('id', id)
    .select('*, clientes(id, nome, telefone)')
    .single();

  if (error) throw error;
  return data as AfiacaoComCliente;
}

export async function deleteAfiacao(id: string) {
  const { error } = await supabase.from('afiacoes').delete().eq('id', id);
  if (error) throw error;
}