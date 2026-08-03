import { supabase } from '@/lib/supabase';
import type { Cliente } from '@/types/domain';
import { sanitizeText } from '@/utils/format';

export type ClientePayload = Omit<Cliente, 'id' | 'created_at' | 'updated_at'>;

export async function fetchClientes(search = '') {
  let query = supabase.from('clientes').select('*').order('nome');

  if (search.trim()) {
    query = query.ilike('nome', `%${search.trim()}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Cliente[];
}

export async function createCliente(payload: ClientePayload) {
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: sanitizeText(payload.nome),
      telefone: sanitizeText(payload.telefone),
      endereco: sanitizeText(payload.endereco),
      observacoes: sanitizeText(payload.observacoes),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data as Cliente;
}

export async function updateCliente(id: string, payload: ClientePayload) {
  const { data, error } = await supabase
    .from('clientes')
    .update({
      nome: sanitizeText(payload.nome),
      telefone: sanitizeText(payload.telefone),
      endereco: sanitizeText(payload.endereco),
      observacoes: sanitizeText(payload.observacoes),
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as Cliente;
}

export async function deleteCliente(id: string) {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) throw error;
}