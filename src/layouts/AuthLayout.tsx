import type { ReactNode } from 'react';
import { Sparkles } from 'lucide-react';

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

        <div className="flex items-center justify-center">{children}</div>
      </div>
    </div>
  );
}