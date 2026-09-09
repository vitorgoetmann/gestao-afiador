import { supabase } from '@/lib/supabase';
import type { Cliente } from '@/types/domain';
import { sanitizeSearchTerm, sanitizeText } from '@/utils/format';
import { addMonths, isBefore, parseISO } from 'date-fns';
import { getCurrentUserId } from '@/services/authService';

export type ClientePayload = Omit<Cliente, 'id' | 'created_at' | 'updated_at' | 'ultima_afiacao' | 'alerta_atrasado'>;

export async function fetchClientes(search = '') {
  let query = supabase.from('clientes').select('*').order('nome');

  const safeSearch = sanitizeSearchTerm(search);
  if (safeSearch) {
    query = query.ilike('nome', `%${safeSearch}%`);
  }

  const [{ data, error }, { data: afiacoes, error: afiacoesError }] = await Promise.all([
    query,
    supabase.from('afiacoes').select('cliente_id, data_afiacao, created_at'),
  ]);
  if (error) throw error;
  if (afiacoesError) throw afiacoesError;

  const ultimaPorCliente = new Map<string, string>();
  (afiacoes ?? []).forEach((afiacao) => {
    const dataAfiacao = String(afiacao.data_afiacao ?? afiacao.created_at).slice(0, 10);
    const atual = ultimaPorCliente.get(String(afiacao.cliente_id));
    if (!atual || dataAfiacao > atual) ultimaPorCliente.set(String(afiacao.cliente_id), dataAfiacao);
  });

  return (data as Cliente[]).map((cliente) => {
    const ultimaAfiacao = ultimaPorCliente.get(cliente.id);
    const periodo = Number(cliente.alerta_periodo_meses ?? 3);
    const alertaCienteEm = cliente.alerta_ciente_em ?? null;
    const alertaAtrasado = Boolean(cliente.alerta_ativo)
      && Boolean(ultimaAfiacao)
      && !isBefore(new Date(), addMonths(parseISO(ultimaAfiacao as string), periodo))
      && (!alertaCienteEm || alertaCienteEm.slice(0, 10) < (ultimaAfiacao as string));

    return {
      ...cliente,
      alerta_ativo: Boolean(cliente.alerta_ativo),
      alerta_periodo_meses: periodo,
      alerta_ciente_em: alertaCienteEm,
      alerta_atrasado: alertaAtrasado,
      ultima_afiacao: ultimaAfiacao,
    };
  });
}

export async function createCliente(payload: ClientePayload) {
  const ownerId = await getCurrentUserId();
  const { data, error } = await supabase
    .from('clientes')
    .insert({
      nome: sanitizeText(payload.nome),
      telefone: sanitizeText(payload.telefone),
      endereco: sanitizeText(payload.endereco),
      observacoes: sanitizeText(payload.observacoes),
      alerta_ativo: payload.alerta_ativo,
      alerta_periodo_meses: payload.alerta_periodo_meses,
      alerta_ciente_em: payload.alerta_ciente_em ?? null,
      owner_id: ownerId,
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
      alerta_ativo: payload.alerta_ativo,
      alerta_periodo_meses: payload.alerta_periodo_meses,
      alerta_ciente_em: payload.alerta_ciente_em ?? null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return data as Cliente;
}

export async function deleteCliente(id: string) {
  const { error } = await supabase.from('clientes').delete().eq('id', id);
  if (error) {
    if (error.code === '23503') {
      throw new Error('Este cliente possui afiações vinculadas. Exclua ou remova as afiações antes de excluir o cliente.');
    }

    throw error;
  }
}

export async function acknowledgeClienteAlert(id: string) {
  const { error } = await supabase
    .from('clientes')
    .update({ alerta_ciente_em: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
