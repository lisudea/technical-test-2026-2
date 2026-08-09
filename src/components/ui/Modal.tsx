import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'relative z-10 max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-surface-line bg-surface-card p-5 shadow-soft animate-slide-up sm:rounded-2xl',
          className
        )}
      >
        {title && (
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-ink">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="rounded-lg p-1.5 text-ink-muted transition-colors hover:bg-surface-line/50 hover:text-ink"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        )}
        <div className="text-sm text-ink-soft">{children}</div>
        {footer && (
          <div className="mt-6 flex items-center justify-end gap-2 border-t border-surface-line pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
