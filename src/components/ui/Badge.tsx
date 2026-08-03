import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { children: ReactNode };

export function Badge({ className, children, ...props }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground', className)} {...props}>
      {children}
    </span>
  );
}