import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-surface-line bg-surface px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-dark">
        {icon ?? <Inbox className="h-7 w-7" aria-hidden />}
      </div>
      <div>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        {description && (
          <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
