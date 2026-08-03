import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

export function Drawer({ open, title, children, onClose }: { open: boolean; title: string; children: ReactNode; onClose: () => void }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/45">
      <div className="absolute inset-x-0 bottom-0 rounded-t-[1.75rem] border border-border bg-background p-5 shadow-[0_-24px_60px_-24px_rgba(0,0,0,0.45)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}