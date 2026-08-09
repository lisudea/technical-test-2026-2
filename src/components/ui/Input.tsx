import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          className={cn(
            'h-11 w-full rounded-xl border bg-surface-card px-3.5 text-sm text-ink shadow-sm transition-colors duration-200 placeholder:text-ink-muted/70 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-surface',
            error
              ? 'border-state-reservado/60 focus:ring-state-reservado'
              : 'border-surface-line hover:border-primary/50',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="text-xs font-medium text-state-reservado">{error}</p>
        ) : hint ? (
          <p className="text-xs text-ink-muted">{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
