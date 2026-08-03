import { createClient, type Session, type User } from '@supabase/supabase-js';

type LocalRow = Record<string, unknown> & { id: string; created_at: string; updated_at?: string };
type StoredUser = { id: string; email: string; password: string; user_metadata: Record<string, unknown> };
type UserLike = Pick<User, 'id' | 'email' | 'user_metadata'>;

const STORAGE_KEYS = {
  users: 'vibe-local-users',
  clientes: 'vibe-local-clientes',
  afiacoes: 'vibe-local-afiacoes',
  auth: 'vibe-local-auth',
};

const DEMO_EMAIL = 'teste@vibeafiacoes.local';
const DEMO_PASSWORD = 'teste1234';
const DEMO_USERNAME = 'Teste Vibe';

const demoClients: LocalRow[] = [
  {
    id: crypto.randomUUID(),
    nome: 'Mercado Central',
    telefone: '11999990000',
    endereco: 'Rua das Flores, 100',
    observacoes: 'Cliente recorrente',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    nome: 'Salão Estilo',
    telefone: '11988887777',
    endereco: 'Av. Paulista, 2000',
    observacoes: 'Retirada semanal',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const demoAfiacoes: LocalRow[] = [
  {
    id: crypto.randomUUID(),
    cliente_id: demoClients[0].id,
    tipo_ferramenta: 'Facas',
    outro_tipo: '',
    valor: 45,
    forma_pagamento: 'Pix',
    observacoes: 'Entrega rápida',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: crypto.randomUUID(),
    cliente_id: demoClients[1].id,
    tipo_ferramenta: 'Tesouras',
    outro_tipo: '',
    valor: 60,
    forma_pagamento: 'Dinheiro',
    observacoes: 'Pagamento na retirada',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

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
  if (!readJson<StoredUser[]>(STORAGE_KEYS.users, []).length) {
    writeJson(STORAGE_KEYS.users, [
      {
        id: crypto.randomUUID(),
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        user_metadata: { username: DEMO_USERNAME },
      },
    ]);
  }

  if (!readJson<LocalRow[]>(STORAGE_KEYS.clientes, []).length) writeJson(STORAGE_KEYS.clientes, demoClients);
  if (!readJson<LocalRow[]>(STORAGE_KEYS.afiacoes, []).length) writeJson(STORAGE_KEYS.afiacoes, demoAfiacoes);
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

  constructor(private readonly table: 'users' | 'clientes' | 'afiacoes') {}

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
      const next = rows.map((row) => (row.id === this.mutation?.id ? { ...row, ...this.mutation.payload, updated_at: now } : row));
      writeJson(STORAGE_KEYS[this.table], next);
      const updated = next.find((row) => row.id === this.mutation?.id) ?? null;
      return { data: this.returningSingle ? updated : [updated].filter(Boolean), error: null };
    }

    if (this.mutation?.type === 'delete') {
      const next = rows.filter((row) => row.id !== this.mutation?.id);
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
      const user: StoredUser = {
        id: crypto.randomUUID(),
        email,
        password,
        user_metadata: { username: options?.data?.username ?? email.split('@')[0] },
      };

      users.push(user);
      setUsers(users);

      const session = createSessionForUser(user);
      setSession(session);
      notifyAuthListeners(session);

      return { data: { user: session.user, session }, error: null };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const user = getUsers().find((entry) => entry.email === email && entry.password === password);
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
  from(table: 'users' | 'clientes' | 'afiacoes') {
    return new LocalQueryBuilder(table);
  },
};

const remoteSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const remoteSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase = remoteSupabaseUrl && remoteSupabaseAnonKey
  ? createClient(remoteSupabaseUrl, remoteSupabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (localSupabase as unknown as ReturnType<typeof createClient> & typeof localSupabase);
