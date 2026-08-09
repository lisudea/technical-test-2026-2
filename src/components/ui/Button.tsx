import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-dark shadow-sm disabled:bg-primary/50',
  secondary:
    'bg-primary-50 text-primary-dark hover:bg-primary-100 disabled:bg-primary-50/60',
  outline:
    'border border-surface-line bg-surface-card text-ink hover:border-primary hover:text-primary-dark',
  ghost: 'text-ink-soft hover:bg-surface-line/50 hover:text-ink',
  danger:
    'bg-state-reservado text-white hover:bg-state-reservado/90 shadow-sm disabled:bg-state-reservado/50',
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      iconLeft,
      iconRight,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-semibold transition-colors duration-200 ease-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-70',
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          iconLeft
        )}
        {children}
        {iconRight}
      </button>
    );
  }
);
Button.displayName = 'Button';
