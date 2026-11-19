import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FileX } from 'lucide-react';

export function EmptyState({ title, description, actionLabel, onAction }: { title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <Card className="border-dashed bg-card/70">
      <CardContent className="flex flex-col items-center justify-center px-5 py-14 text-center sm:px-8">
        <div className="rounded-2xl bg-secondary p-4 text-muted-foreground">
          <FileX className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-lg font-semibold">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">{description}</p>
        {actionLabel && onAction ? (
          <Button className="mt-6" onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}