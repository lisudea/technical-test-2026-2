import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  empty?: ReactNode;
  className?: string;
}

export function Table<T>({ columns, data, rowKey, empty, className }: TableProps<T>) {
  if (data.length === 0 && empty) {
    return <>{empty}</>;
  }

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      {/* Desktop / tablet table */}
      <table className="hidden w-full border-collapse text-sm sm:table">
        <thead>
          <tr className="border-b border-surface-line text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-ink-muted',
                  col.hideOnMobile && 'md:table-cell',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={rowKey(row)}
              className="border-b border-surface-line/60 transition-colors hover:bg-surface"
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-4 py-3.5 text-ink-soft', col.hideOnMobile && 'md:table-cell', col.className)}>
                  {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile card list */}
      <ul className="flex flex-col gap-3 sm:hidden">
        {data.map((row) => (
          <li key={rowKey(row)} className="card-base p-4">
            <dl className="flex flex-col gap-2">
              {columns
                .filter((c) => !c.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                      {col.header}
                    </dt>
                    <dd className="text-right text-sm text-ink">
                      {col.render ? col.render(row) : (row as Record<string, ReactNode>)[col.key]}
                    </dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
