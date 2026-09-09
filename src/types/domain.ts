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
  owner_id?: UUID;
  ultima_afiacao?: string;
  alerta_ativo: boolean;
  alerta_periodo_meses: number;
  alerta_ciente_em?: string | null;
  alerta_atrasado?: boolean;
};

export type Material = {
  id: UUID;
  nome: string;
  valor: number;
  observacoes: string;
  created_at: string;
  updated_at: string;
  owner_id?: UUID;
};

export type ItemAfiacao = {
  material_id: UUID;
  nome: string;
  quantidade: number;
  valor_unitario: number;
};

export type Afiacao = {
  id: UUID;
  cliente_id: UUID;
  tipo_ferramenta: string;
  outro_tipo: string;
  itens?: ItemAfiacao[];
  subtotal?: number;
  desconto?: number;
  valor: number;
  forma_pagamento: string;
  observacoes: string;
  data_afiacao?: string;
  created_at: string;
  updated_at: string;
  owner_id?: UUID;
};

export type AfiacaoComCliente = Afiacao & {
  clientes?: Pick<Cliente, 'id' | 'nome' | 'telefone' | 'endereco'> | null;
};

export type DashboardStats = {
  faturamentoTotal: number;
  faturamentoHoje: number;
  faturamentoSemana: number;
  faturamentoMes: number;
  faturamentoAno: number;
  clientes: number;
  afiacoes: number;
  ticketMedio: number;
};

export type ToolKey = 'Facas' | 'Tesouras' | 'Alicates de unha' | 'Alicates de corte' | 'Outros';
export type PaymentMethod = 'Pix' | 'Dinheiro' | 'Carteira';

export const TOOL_OPTIONS: ToolKey[] = ['Facas', 'Tesouras', 'Alicates de unha', 'Alicates de corte', 'Outros'];
export const PAYMENT_OPTIONS: PaymentMethod[] = ['Pix', 'Dinheiro', 'Carteira'];
