import { supabase } from '@/lib/supabase';
import type { Afiacao, AfiacaoComCliente } from '@/types/domain';
import { sanitizeSearchTerm, sanitizeText } from '@/utils/format';
import { getCurrentUserId } from '@/services/authService';

export type AfiacaoPayload = Omit<Afiacao, 'id' | 'created_at' | 'updated_at'>;

export async function fetchAfiacoes(search = '') {
  let query = supabase
    .from('afiacoes')
    .select('*, clientes(id, nome, telefone, endereco)')
    .order('created_at', { ascending: false });

  const safeSearch = sanitizeSearchTerm(search);
  if (safeSearch) {
    query = query.or(`tipo_ferramenta.ilike.%${safeSearch}%,outro_tipo.ilike.%${safeSearch}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AfiacaoComCliente[];
}

export async function createAfiacao(payload: AfiacaoPayload) {
  const ownerId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('afiacoes')
    .insert({
      cliente_id: payload.cliente_id,
      tipo_ferramenta: sanitizeText(payload.tipo_ferramenta),
      outro_tipo: sanitizeText(payload.outro_tipo),
      itens: payload.itens ?? [],
      subtotal: payload.subtotal ?? payload.valor,
      desconto: payload.desconto ?? 0,
      valor: payload.valor,
      forma_pagamento: sanitizeText(payload.forma_pagamento),
      observacoes: sanitizeText(payload.observacoes),
      data_afiacao: payload.data_afiacao,
      owner_id: ownerId,
    })
    .select('*, clientes(id, nome, telefone, endereco)')
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
      itens: payload.itens ?? [],
      subtotal: payload.subtotal ?? payload.valor,
      desconto: payload.desconto ?? 0,
      valor: payload.valor,
      forma_pagamento: sanitizeText(payload.forma_pagamento),
      observacoes: sanitizeText(payload.observacoes),
      data_afiacao: payload.data_afiacao,
    })
    .eq('id', id)
    .select('*, clientes(id, nome, telefone, endereco)')
    .single();

  if (error) throw error;
  return data as AfiacaoComCliente;
}

export async function deleteAfiacao(id: string) {
  const { error } = await supabase.from('afiacoes').delete().eq('id', id);
  if (error) throw error;
}
