import { Loader2 } from 'lucide-react';

export function Loading({ label = 'Carregando', fullScreen = false }: { label?: string; fullScreen?: boolean }) {
  return (
    <div className={fullScreen ? 'flex min-h-screen items-center justify-center p-6' : 'flex items-center justify-center p-6'}>
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground shadow-soft">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>{label}</span>
      </div>
    </div>
  );
}