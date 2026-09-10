import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/common/BrandLogo';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(42,92,138,.2),_transparent_30%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3 text-foreground">
          <BrandLogo className="h-14 w-14 shrink-0" />
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
