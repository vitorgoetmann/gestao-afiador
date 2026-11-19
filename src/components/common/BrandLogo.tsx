import { cn } from '@/lib/utils';

export function BrandLogo({ className, imageClassName }: { className?: string; imageClassName?: string }) {
  return (
    <div className={cn('flex items-center justify-center overflow-hidden rounded-full bg-white shadow-soft ring-1 ring-border', className)}>
      <img src="/logo.png" alt="Vibe Afiações" className={cn('h-full w-full object-contain', imageClassName)} />
    </div>
  );
}
