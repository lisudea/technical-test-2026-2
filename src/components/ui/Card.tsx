import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'article' | 'section';
  interactive?: boolean;
}

export function Card({ children, className, as: Tag = 'div', interactive }: CardProps) {
  return (
    <Tag
      className={cn(
        'card-base p-5',
        interactive &&
          'transition-all duration-200 ease-smooth hover:-translate-y-0.5 hover:shadow-soft hover:border-primary/40',
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function CardHeader({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-sm text-ink-soft', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('mt-4 flex items-center justify-end gap-2 border-t border-surface-line pt-4', className)}>
      {children}
    </div>
  );
}
