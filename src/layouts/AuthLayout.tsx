import type { ReactNode } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(15,122,59,.18),_transparent_30%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3 text-foreground">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Vibe Afiações</p>
            <p className="text-sm text-muted-foreground">Gestão profissional de afiações</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="hidden rounded-[2rem] border border-border bg-card/80 p-8 shadow-soft lg:flex lg:flex-col lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                <ShieldCheck className="h-3.5 w-3.5" />
                Mobile first SaaS
              </span>
              <h1 className="mt-6 max-w-lg text-4xl font-semibold tracking-tight text-foreground">
                Operação enxuta, fluxo claro e interface pronta para uso real.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Controle clientes, afiações, faturamento e relatórios com uma experiência consistente em celular e desktop.
              </p>
            </div>
            <div className="grid gap-3 text-sm text-muted-foreground">
              <div className="rounded-2xl border border-border bg-background/80 p-4">Autenticação Supabase com sessão persistida.</div>
              <div className="rounded-2xl border border-border bg-background/80 p-4">CRUD completo com validações fortes e filtros persistentes.</div>
              <div className="rounded-2xl border border-border bg-background/80 p-4">Tema claro e escuro com identidade visual verde.</div>
            </div>
          </div>
          <div className="flex items-center justify-center">{children}</div>
        </div>
      </div>
    </div>
  );
}