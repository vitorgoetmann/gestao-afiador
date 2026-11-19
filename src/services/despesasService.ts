import { supabase } from '@/lib/supabase';
import type { Despesa } from '@/types/domain';
import { sanitizeSearchTerm, sanitizeText } from '@/utils/format';
import { getCurrentUserId } from '@/services/authService';

export type DespesaPayload = Pick<Despesa, 'data_despesa' | 'motivo' | 'valor'>;

export async function fetchDespesas(search = '') {
  const ownerId = await getCurrentUserId();
  let query = supabase.from('despesas').select('*').eq('owner_id', ownerId).order('data_despesa', { ascending: false });
  const safeSearch = sanitizeSearchTerm(search);
  if (safeSearch) query = query.ilike('motivo', `%${safeSearch}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data as Despesa[];
}

export async function createDespesa(payload: DespesaPayload) {
  const ownerId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('despesas')
    .insert({ data_despesa: payload.data_despesa, motivo: sanitizeText(payload.motivo), valor: payload.valor, owner_id: ownerId })
    .select('*')
    .single();
  if (error) throw error;
  return data as Despesa;
}

export async function deleteDespesa(id: string) {
  const ownerId = await getCurrentUserId();
  const { error } = await supabase.from('despesas').delete().eq('id', id).eq('owner_id', ownerId);
  if (error) throw error;
}
