import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpinnerProps {
  className?: string;
  label?: string;
}

export function Spinner({ className, label }: SpinnerProps) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-ink-muted', className)} role="status">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}
