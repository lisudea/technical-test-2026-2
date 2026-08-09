import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, XCircle, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  title: string;
  message?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: {
    success: (message: string, title?: string) => void;
    error: (message: string, title?: string) => void;
    info: (message: string, title?: string) => void;
  };
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { t } = useTranslation();

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant: ToastVariant, message: string, title?: string) => {
      const id = ++nextId;
      const resolvedTitle =
        title ??
        (variant === 'success'
          ? t('toast.success')
          : variant === 'error'
            ? t('toast.error')
            : t('common.appName'));
      setToasts((prev) => [...prev, { id, title: resolvedTitle, message, variant }]);
      window.setTimeout(() => remove(id), 4500);
    },
    [remove, t]
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      toast: {
        success: (m, title) => push('success', m, title),
        error: (m, title) => push('error', m, title),
        info: (m, title) => push('info', m, title),
      },
    }),
    [push]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={() => remove(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast(): ToastContextValue['toast'] {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx.toast;
}

const VARIANT_STYLES: Record<ToastVariant, { ring: string; icon: ReactNode }> = {
  success: {
    ring: 'border-state-disponible/30 bg-state-disponible/5',
    icon: <CheckCircle2 className="h-5 w-5 text-state-disponible" aria-hidden />,
  },
  error: {
    ring: 'border-state-reservado/30 bg-state-reservado/5',
    icon: <XCircle className="h-5 w-5 text-state-reservado" aria-hidden />,
  },
  info: {
    ring: 'border-primary/30 bg-primary/5',
    icon: <Info className="h-5 w-5 text-primary" aria-hidden />,
  },
};

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const style = VARIANT_STYLES[toast.variant];
  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-surface-card p-4 shadow-soft animate-slide-up',
        style.ring
      )}
    >
      <span className="mt-0.5 shrink-0">{style.icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-sm text-ink-soft break-words">{toast.message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="shrink-0 rounded-md p-1 text-ink-muted hover:bg-surface-line/60 hover:text-ink transition-colors"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
