import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from './EmptyState';

export function DataTable({
  title,
  description,
  loading,
  empty,
  actions,
  children,
}: {
  title: string;
  description?: string;
  loading: boolean;
  empty: boolean;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="flex flex-col gap-3 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-base font-semibold">{title}</h2>
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="w-full sm:w-auto">{actions}</div> : null}
        </div>
        {loading ? (
          <Loading label="Carregando dados" />
        ) : empty ? (
          <div className="p-5 sm:p-6">
            <EmptyState title="Nenhum registro encontrado" description="Crie um item para começar a operar o sistema." />
          </div>
        ) : (
          <div className="overflow-x-auto">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}
