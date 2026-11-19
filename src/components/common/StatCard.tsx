import type { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  accent = false,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  accent?: boolean;
}) {
  return (
    <Card className={cn('overflow-hidden', accent && 'border-primary/20 bg-primary/5')}>
      <CardContent className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight sm:text-[2rem]">{value}</p>
          {subtitle ? <p className="mt-2 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {icon ? <div className="rounded-2xl bg-secondary p-3 text-primary">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}