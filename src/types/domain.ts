export type UUID = string;

export type Profile = {
  id: UUID;
  username: string;
  email: string;
  created_at: string;
};

export type Cliente = {
  id: UUID;
  nome: string;
  telefone: string;
  endereco: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
};

export type Afiacao = {
  id: UUID;
  cliente_id: UUID;
  tipo_ferramenta: string;
  outro_tipo: string;
  valor: number;
  forma_pagamento: string;
  observacoes: string;
  created_at: string;
  updated_at: string;
};

export type AfiacaoComCliente = Afiacao & {
  clientes?: Pick<Cliente, 'id' | 'nome' | 'telefone'> | null;
};

export type DashboardStats = {
  faturamentoTotal: number;
  faturamentoHoje: number;
  faturamentoSemana: number;
  faturamentoMes: number;
  clientes: number;
  afiacoes: number;
  ticketMedio: number;
};

export type ToolKey = 'Facas' | 'Tesouras' | 'Alicates de unha' | 'Alicates de corte' | 'Outros';
export type PaymentMethod = 'Pix' | 'Dinheiro';

export const TOOL_OPTIONS: ToolKey[] = ['Facas', 'Tesouras', 'Alicates de unha', 'Alicates de corte', 'Outros'];
export const PAYMENT_OPTIONS: PaymentMethod[] = ['Pix', 'Dinheiro'];