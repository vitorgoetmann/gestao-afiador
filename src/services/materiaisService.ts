import { supabase } from '@/lib/supabase';
import type { Material } from '@/types/domain';
import { sanitizeSearchTerm, sanitizeText } from '@/utils/format';
import { getCurrentUserId } from '@/services/authService';

export type MaterialPayload = Pick<Material, 'nome' | 'valor' | 'observacoes'>;

export async function fetchMateriais(search = '') {
  const ownerId = await getCurrentUserId();
  let query = supabase.from('materiais').select('*').eq('owner_id', ownerId).order('nome', { ascending: true });
  const safeSearch = sanitizeSearchTerm(search);
  if (safeSearch) query = query.ilike('nome', `%${safeSearch}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data as Material[];
}

export async function createMaterial(payload: MaterialPayload) {
  const ownerId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('materiais')
    .insert({ nome: sanitizeText(payload.nome), valor: payload.valor, observacoes: sanitizeText(payload.observacoes), owner_id: ownerId })
    .select('*')
    .single();
  if (error) throw error;
  return data as Material;
}

export async function updateMaterial(id: string, payload: MaterialPayload) {
  const ownerId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('materiais')
    .update({ nome: sanitizeText(payload.nome), valor: payload.valor, observacoes: sanitizeText(payload.observacoes) })
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select('*')
    .single();
  if (error) throw error;
  return data as Material;
}

export async function deleteMaterial(id: string) {
  const ownerId = await getCurrentUserId();
  const { error } = await supabase.from('materiais').delete().eq('id', id).eq('owner_id', ownerId);
  if (error) throw error;
}
