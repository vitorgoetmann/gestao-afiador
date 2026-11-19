import { createClient, type Session, type User } from '@supabase/supabase-js';

type LocalRow = Record<string, unknown> & { id: string; created_at: string; updated_at?: string };
type StoredUser = { id: string; email: string; password: string; user_metadata: Record<string, unknown> };
type UserLike = Pick<User, 'id' | 'email' | 'user_metadata'>;

const STORAGE_KEYS = {
  users: 'vibe-local-users',
  clientes: 'vibe-local-clientes',
  materiais: 'vibe-local-materiais',
  afiacoes: 'vibe-local-afiacoes',
  despesas: 'vibe-local-despesas',
  auth: 'vibe-local-auth',
  seedVersion: 'vibe-local-seed-version',
};

const DEMO_EMAIL = 'teste@vibeafiacoes.local';
const DEMO_PASSWORD = 'teste1234';
const DEMO_USERNAME = 'Teste Vibe';
const DEMO_USER_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_SEED_VERSION = '2026-11-three-months-v1';

const demoPeriodEnd = new Date();
demoPeriodEnd.setHours(12, 0, 0, 0);
const demoPeriodStart = new Date(demoPeriodEnd);
demoPeriodStart.setMonth(demoPeriodStart.getMonth() - 3);

function demoDate(position: number, total = 17) {
  const timestamp = demoPeriodStart.getTime()
    + ((demoPeriodEnd.getTime() - demoPeriodStart.getTime()) * position) / total;
  return new Date(timestamp).toISOString().slice(0, 10);
}

function demoTimestamp(position: number, total = 17) {
  return `${demoDate(position, total)}T15:00:00.000Z`;
}

const demoMaterialDefinitions = [
  ['Faca doméstica', 15, 'Afiação padrão'],
  ['Faca profissional', 24, 'Lâminas de cozinha profissional'],
  ['Tesoura', 20, 'Tesouras de uso geral'],
  ['Alicate de cutícula', 12, 'Atendimento para salões e manicures'],
  ['Lâmina de máquina', 28, 'Máquinas de corte e pet shop'],
  ['Podão', 32, 'Ferramentas de jardinagem'],
] as const;

const demoMateriais: LocalRow[] = demoMaterialDefinitions.map(([nome, valor, observacoes], index) => ({
  id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  owner_id: DEMO_USER_ID,
  nome,
  valor,
  observacoes,
  created_at: demoTimestamp(0),
  updated_at: demoTimestamp(0),
}));

const demoClientDefinitions = [
  ['Mercado Central', '11999990000', 'Rua das Flores, 100', 'Cliente recorrente', true, 2],
  ['Salão Estilo', '11988887777', 'Av. Paulista, 2000', 'Retirada quinzenal', true, 1],
  ['Pet Shop Amigo Fiel', '11977776666', 'Rua dos Animais, 45', 'Avisar pelo WhatsApp', true, 2],
  ['Restaurante Sabor da Casa', '11966665555', 'Rua do Comércio, 310', 'Preferência por pagamento via Pix', false, 3],
  ['Jardins & Cia.', '11955554444', 'Alameda Verde, 88', 'Ferramentas identificadas por etiqueta', true, 3],
  ['Marina Oliveira', '11944443333', 'Rua Aurora, 27', 'Cliente particular', false, 3],
] as const;

const demoClients: LocalRow[] = demoClientDefinitions.map(([nome, telefone, endereco, observacoes, alertaAtivo, periodo], index) => ({
  id: `20000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  owner_id: DEMO_USER_ID,
  nome,
  telefone,
  endereco,
  observacoes,
  alerta_ativo: alertaAtivo,
  alerta_periodo_meses: periodo,
  alerta_ciente_em: null,
  created_at: demoTimestamp(index),
  updated_at: demoTimestamp(index),
}));

const demoServiceDefinitions = [
  [0, 0, [[0, 4]], 0, 'Pix', 'Entrega no balcão'],
  [1, 1, [[2, 3], [3, 5]], 5, 'Dinheiro', 'Retirada combinada'],
  [2, 2, [[4, 2]], 0, 'Cartão de crédito', 'Lâminas higienizadas'],
  [3, 3, [[1, 5], [0, 3]], 10, 'Pix', 'Serviço para a cozinha'],
  [4, 4, [[5, 2]], 0, 'Boleto', 'Ferramentas etiquetadas'],
  [5, 5, [[0, 2], [2, 1]], 0, 'Dinheiro', 'Cliente retirou no mesmo dia'],
  [6, 1, [[2, 4], [3, 6]], 8, 'Pix', 'Pacote do salão'],
  [7, 2, [[4, 3]], 0, 'Cartão de débito', 'Manutenção periódica'],
  [8, 3, [[1, 6]], 12, 'Pix', 'Desconto comercial'],
  [9, 0, [[0, 5]], 0, 'Dinheiro', 'Entrega normal'],
  [10, 4, [[5, 3], [0, 1]], 5, 'Pix', 'Incluído um canivete'],
  [11, 1, [[2, 2], [3, 8]], 0, 'Cartão de crédito', 'Movimento de fim de mês'],
  [12, 3, [[1, 4], [0, 4]], 10, 'Pix', 'Pedido urgente'],
  [13, 2, [[4, 2], [2, 1]], 0, 'Pix', 'Revisão de equipamento'],
  [14, 5, [[0, 3], [2, 2]], 0, 'Dinheiro', 'Cliente particular'],
  [15, 0, [[0, 6]], 5, 'Pix', 'Lote semanal'],
  [16, 1, [[2, 5], [3, 4]], 10, 'Cartão de débito', 'Retirada à tarde'],
  [17, 3, [[1, 5], [0, 5]], 15, 'Pix', 'Serviço concluído hoje'],
] as const;

const demoAfiacoes: LocalRow[] = demoServiceDefinitions.map(([position, clientIndex, itemDefinitions, desconto, formaPagamento, observacoes], index) => {
  const itens = itemDefinitions.map(([materialIndex, quantidade]) => ({
    material_id: demoMateriais[materialIndex].id,
    nome: demoMateriais[materialIndex].nome,
    quantidade,
    valor_unitario: demoMateriais[materialIndex].valor,
  }));
  const subtotal = itens.reduce((sum, item) => sum + Number(item.quantidade) * Number(item.valor_unitario), 0);
  return {
    id: `30000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    owner_id: DEMO_USER_ID,
    cliente_id: demoClients[clientIndex].id,
    tipo_ferramenta: itens.map((item) => item.nome).join(', '),
    outro_tipo: '',
    itens,
    subtotal,
    desconto,
    valor: subtotal - desconto,
    forma_pagamento: formaPagamento,
    observacoes,
    data_afiacao: demoDate(position),
    created_at: demoTimestamp(position),
    updated_at: demoTimestamp(position),
  };
});

const demoExpenseDefinitions = [
  [1, 'Compra de rebolos abrasivos', 180],
  [3, 'Energia elétrica', 142.5],
  [5, 'Óleo lubrificante', 48.9],
  [7, 'Manutenção da máquina', 220],
  [9, 'Material de embalagem', 65.4],
  [11, 'Energia elétrica', 151.8],
  [13, 'Anúncios locais', 90],
  [15, 'Reposição de discos', 134.7],
  [16, 'Produtos de limpeza', 37.5],
] as const;

const demoDespesas: LocalRow[] = demoExpenseDefinitions.map(([position, motivo, valor], index) => ({
  id: `40000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  owner_id: DEMO_USER_ID,
  data_despesa: demoDate(position),
  motivo,
  valor,
  created_at: demoTimestamp(position),
  updated_at: demoTimestamp(position),
}));

function hasStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasStorage()) return fallback;
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (!hasStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function seedLocalData() {
  const users = readJson<StoredUser[]>(STORAGE_KEYS.users, []);
  if (!users.some((user) => user.email === DEMO_EMAIL)) {
    writeJson(STORAGE_KEYS.users, [
      ...users,
      {
        id: DEMO_USER_ID,
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        user_metadata: { username: DEMO_USERNAME },
      },
    ]);
  }

  // A carga acontece apenas uma vez por navegador. Depois disso, os dados ficam
  // sob controle do usuário e não são recriados ao atualizar a página.
  if (window.localStorage.getItem(STORAGE_KEYS.seedVersion) !== DEMO_SEED_VERSION) {
    const storedClientes = readJson<LocalRow[]>(STORAGE_KEYS.clientes, []);
    const storedMateriais = readJson<LocalRow[]>(STORAGE_KEYS.materiais, []);
    const storedAfiacoes = readJson<LocalRow[]>(STORAGE_KEYS.afiacoes, []);
    const storedDespesas = readJson<LocalRow[]>(STORAGE_KEYS.despesas, []);
    const isUntouchedLegacyDemo = storedClientes.length === 2
      && storedMateriais.length === 3
      && storedAfiacoes.length === 2
      && storedDespesas.length === 0
      && storedClientes.some((item) => item.nome === 'Mercado Central')
      && storedClientes.some((item) => item.nome === 'Salão Estilo');

    if (!storedClientes.length || isUntouchedLegacyDemo) writeJson(STORAGE_KEYS.clientes, demoClients);
    if (!storedMateriais.length || isUntouchedLegacyDemo) writeJson(STORAGE_KEYS.materiais, demoMateriais);
    if (!storedAfiacoes.length || isUntouchedLegacyDemo) writeJson(STORAGE_KEYS.afiacoes, demoAfiacoes);
    if (!storedDespesas.length || isUntouchedLegacyDemo) writeJson(STORAGE_KEYS.despesas, demoDespesas);
    window.localStorage.setItem(STORAGE_KEYS.seedVersion, DEMO_SEED_VERSION);
  }
}

seedLocalData();

function getUsers() {
  return readJson<StoredUser[]>(STORAGE_KEYS.users, []);
}

function setUsers(users: StoredUser[]) {
  writeJson(STORAGE_KEYS.users, users);
}

function getSession() {
  return readJson<Session | null>(STORAGE_KEYS.auth, null);
}

function setSession(session: Session | null) {
  writeJson(STORAGE_KEYS.auth, session);
}

const authListeners = new Set<(session: Session | null) => void>();

function notifyAuthListeners(session: Session | null) {
  authListeners.forEach((listener) => listener(session));
}

function createSessionForUser(user: UserLike): Session {
  return {
    access_token: crypto.randomUUID(),
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: crypto.randomUUID(),
    user: {
      id: user.id,
      email: user.email,
      user_metadata: user.user_metadata,
    } as User,
  } as Session;
}

class LocalQueryBuilder {
  private filters: Array<(row: LocalRow) => boolean> = [];
  private sortField: string | null = null;
  private ascending = true;
  private searchField: string | null = null;
  private searchTerm: string | null = null;
  private customSearch: Array<{ field: string; value: string }> = [];
  private range: { field: string; from?: string; to?: string } | null = null;
  private mutation: { type: 'insert' | 'update' | 'delete'; payload?: Record<string, unknown>; id?: string } | null = null;
  private includeClientes = false;
  private returningSingle = false;

  constructor(private readonly table: 'users' | 'clientes' | 'materiais' | 'afiacoes' | 'despesas') {}

  select(columns: string) {
    this.includeClientes = columns.includes('clientes(');
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.sortField = field;
    this.ascending = options?.ascending ?? true;
    return this;
  }

  ilike(field: string, value: string) {
    this.searchField = field;
    this.searchTerm = value.replace(/%/g, '').toLowerCase();
    return this;
  }

  or(expression: string) {
    this.customSearch = expression.split(',').map((chunk) => {
      const [fieldPart, , valuePart] = chunk.split('.');
      return { field: fieldPart, value: valuePart?.replace(/%/g, '').toLowerCase() ?? '' };
    });
    return this;
  }

  eq(field: string, value: string) {
    if (this.mutation && field === 'id') {
      this.mutation.id = value;
      return this;
    }

    this.filters.push((row) => String(row[field]) === value);
    return this;
  }

  gte(field: string, value: string) {
    this.range = { field, from: value };
    return this;
  }

  lte(field: string, value: string) {
    this.range = { ...(this.range ?? { field }), to: value };
    return this;
  }

  insert(payload: Record<string, unknown> | Record<string, unknown>[]) {
    const rows = Array.isArray(payload) ? payload : [payload];
    this.mutation = { type: 'insert', payload: rows[0] };
    return this;
  }

  update(payload: Record<string, unknown>) {
    this.mutation = { type: 'update', payload };
    return this;
  }

  delete() {
    this.mutation = { type: 'delete' };
    return this;
  }

  single() {
    this.returningSingle = true;
    return this;
  }

  async execute() {
    const data = readJson<LocalRow[]>(STORAGE_KEYS[this.table], []);

    if (this.mutation) return this.runMutation(data);

    let filtered = [...data];

    if (this.filters.length) filtered = filtered.filter((row) => this.filters.every((filter) => filter(row)));

    if (this.searchField && this.searchTerm) {
      filtered = filtered.filter((row) => String(row[this.searchField ?? '']).toLowerCase().includes(this.searchTerm ?? ''));
    }

    if (this.customSearch.length) {
      filtered = filtered.filter((row) => this.customSearch.some((term) => String(row[term.field] ?? '').toLowerCase().includes(term.value)));
    }

    if (this.range) {
      filtered = filtered.filter((row) => {
        const current = String(row[this.range?.field ?? 'created_at']);
        const fromOk = this.range?.from ? current >= this.range.from : true;
        const toOk = this.range?.to ? current <= this.range.to : true;
        return fromOk && toOk;
      });
    }

    if (this.sortField) {
      filtered.sort((left, right) => {
        const leftValue = String(left[this.sortField ?? '']);
        const rightValue = String(right[this.sortField ?? '']);
        return this.ascending ? leftValue.localeCompare(rightValue) : rightValue.localeCompare(leftValue);
      });
    }

    const mapped = this.includeClientes && this.table === 'afiacoes'
      ? filtered.map((row) => ({
          ...row,
          clientes: readJson<LocalRow[]>(STORAGE_KEYS.clientes, []).find((cliente) => cliente.id === row.cliente_id) ?? null,
        }))
      : filtered;

    return { data: this.returningSingle ? (mapped[0] ?? null) : mapped, error: null };
  }

  private async runMutation(rows: LocalRow[]) {
    const now = new Date().toISOString();

    if (this.mutation?.type === 'insert') {
      const row = { id: crypto.randomUUID(), created_at: now, updated_at: now, ...this.mutation.payload } as LocalRow;
      writeJson(STORAGE_KEYS[this.table], [...rows, row]);
      return { data: this.returningSingle ? row : [row], error: null };
    }

    if (this.mutation?.type === 'update') {
      const next = rows.map((row) => (
        row.id === this.mutation?.id && this.filters.every((filter) => filter(row))
          ? { ...row, ...this.mutation.payload, updated_at: now }
          : row
      ));
      writeJson(STORAGE_KEYS[this.table], next);
      const updated = next.find((row) => row.id === this.mutation?.id && this.filters.every((filter) => filter(row))) ?? null;
      return { data: this.returningSingle ? updated : [updated].filter(Boolean), error: null };
    }

    if (this.mutation?.type === 'delete') {
      const next = rows.filter((row) => !(row.id === this.mutation?.id && this.filters.every((filter) => filter(row))));
      writeJson(STORAGE_KEYS[this.table], next);
      return { data: null, error: null };
    }

    return { data: null, error: { message: 'Unsupported local mutation.' } };
  }

  then<TResult1 = { data: unknown; error: null | { message: string } }, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: null | { message: string } }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }
}

const localSupabase = {
  auth: {
    async getSession() {
      return { data: { session: getSession() } };
    },
    async getUser() {
      return { data: { user: getSession()?.user ?? null }, error: null };
    },
    onAuthStateChange(callback: (_event: string, session: Session | null) => void) {
      const listener = (session: Session | null) => callback('SIGNED_IN', session);
      authListeners.add(listener);
      return {
        data: {
          subscription: {
            unsubscribe: () => authListeners.delete(listener),
          },
        },
      };
    },
    async signUp({ email, password, options }: { email: string; password: string; options?: { data?: { username?: string } } }) {
      const users = getUsers();
      const normalizedEmail = email.trim().toLowerCase();
      if (users.some((entry) => entry.email === normalizedEmail)) {
        return { data: null, error: { message: 'Este e-mail jÃ¡ estÃ¡ cadastrado.' } };
      }

      const user: StoredUser = {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        password,
        user_metadata: { username: options?.data?.username?.trim() ?? normalizedEmail.split('@')[0] },
      };

      users.push(user);
      setUsers(users);

      const session = createSessionForUser(user);
      setSession(session);
      notifyAuthListeners(session);

      return { data: { user: session.user, session }, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const normalizedEmail = email.trim().toLowerCase();
      const user = getUsers().find((entry) => entry.email === normalizedEmail && entry.password === password);
      if (!user) return { data: null, error: { message: 'Credenciais inválidas.' } };

      const session = createSessionForUser(user);
      setSession(session);
      notifyAuthListeners(session);
      return { data: { user: session.user, session }, error: null };
    },
    async signOut() {
      setSession(null);
      notifyAuthListeners(null);
      return { error: null };
    },
    async resetPasswordForEmail() {
      return { error: null };
    },
    async updateUser({ password }: { password: string }) {
      const session = getSession();
      if (!session) return { error: { message: 'Nenhuma sessão ativa.' } };

      const nextUsers = getUsers().map((user) => (user.id === session.user.id ? { ...user, password } : user));
      setUsers(nextUsers);
      return { error: null };
    },
  },
  from(table: 'users' | 'clientes' | 'materiais' | 'afiacoes' | 'despesas') {
    return new LocalQueryBuilder(table);
  },
};

const remoteSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const remoteSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const hasRemoteSupabase = Boolean(remoteSupabaseUrl && remoteSupabaseAnonKey);

if (!hasRemoteSupabase && !import.meta.env.DEV) {
  throw new Error('Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente de produção.');
}

export const supabase = hasRemoteSupabase
  ? createClient(remoteSupabaseUrl!, remoteSupabaseAnonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (localSupabase as unknown as ReturnType<typeof createClient> & typeof localSupabase);
