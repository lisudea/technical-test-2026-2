import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-state-reservado/20 bg-state-reservado/5 px-6 py-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-state-reservado/10 text-state-reservado">
        <AlertTriangle className="h-7 w-7" aria-hidden />
      </div>
      <p className="max-w-md text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}
