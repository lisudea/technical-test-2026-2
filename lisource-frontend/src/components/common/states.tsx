import { AlertCircle, PackageSearch } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-soft text-brand-dark">
        <PackageSearch className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({
  title,
  description,
  actionLabel,
  onRetry,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
        <AlertCircle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      <Button variant="outline" onClick={onRetry}>
        {actionLabel}
      </Button>
    </div>
  );
}

export function MetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="surface-card p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function EquipmentListSkeleton() {
  return (
    <div>
      <div className="hidden md:block">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b border-border px-5 py-4">
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-7 w-28 rounded-full" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 p-4 md:hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="surface-card p-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-3 h-3 w-24" />
            <Skeleton className="mt-4 h-7 w-28 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
