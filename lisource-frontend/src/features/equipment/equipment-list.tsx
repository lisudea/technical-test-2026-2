import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Cpu, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useState } from "react";

import { EmptyState, EquipmentListSkeleton, ErrorState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import type { EquipmentDto, Paginated } from "@/types";

function EquipmentThumb({ item }: { item: EquipmentDto }) {
  const [failed, setFailed] = useState(false);
  if (item.imageUrl && !failed) {
    return (
      <img
        src={item.imageUrl}
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border border-border object-cover"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand-dark"
    >
      <Cpu className="h-5 w-5" />
    </span>
  );
}

export function EquipmentList({
  data,
  isLoading,
  isError,
  onRetry,
  onClearFilters,
  onPageChange,
}: {
  data: Paginated<EquipmentDto> | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  onPageChange?: (page: number) => void;
}) {
  const { t } = useTranslation();

  if (isError) {
    return (
      <div className="surface-card">
        <ErrorState
          title={t("states.errorTitle")}
          description={t("states.errorText")}
          actionLabel={t("common.retry")}
          onRetry={onRetry}
        />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="surface-card overflow-hidden">
        <EquipmentListSkeleton />
      </div>
    );
  }

  if (data.items.length === 0) {
    return (
      <div className="surface-card">
        <EmptyState
          title={t("states.emptyTitle")}
          description={t("states.emptyText")}
          action={
            <Button variant="outline" onClick={onClearFilters}>
              {t("common.clear")}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      {/* Desktop: structured table */}
      <table className="hidden w-full border-collapse text-sm md:table">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-left">
            <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
              {t("equipment.name")}
            </th>
            <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
              {t("equipment.category")}
            </th>
            <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
              {t("equipment.location")}
            </th>
            <th scope="col" className="px-5 py-3 font-medium text-muted-foreground">
              {t("equipment.status")}
            </th>
            <th scope="col" className="px-5 py-3 text-right font-medium text-muted-foreground">
              {t("common.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item) => (
            <tr key={item.id} className="border-b border-border last:border-0 hover:bg-muted/40">
              <td className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <EquipmentThumb item={item} />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{item.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{item.inventoryCode}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4 text-muted-foreground">{item.category.name}</td>
              <td className="px-5 py-4 text-muted-foreground">
                {item.location?.name ?? t("common.notAvailable")}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={item.visualStatus} />
              </td>
              <td className="px-5 py-4 text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link to="/equipos/$equipmentId" params={{ equipmentId: String(item.id) }}>
                    {t("common.details")}
                  </Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: cards */}
      <ul className="divide-y divide-border md:hidden">
        {data.items.map((item) => (
          <li key={item.id} className="p-4">
            <div className="flex items-start gap-3">
              <EquipmentThumb item={item} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="font-mono text-xs text-muted-foreground">{item.inventoryCode}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.category.name}
                  {item.location ? (
                    <span className="inline-flex items-center gap-1">
                      {" · "}
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {item.location.name}
                    </span>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <StatusBadge status={item.visualStatus} />
              <Button asChild variant="outline" size="sm">
                <Link to="/equipos/$equipmentId" params={{ equipmentId: String(item.id) }}>
                  {t("common.details")}
                </Link>
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {onPageChange && data.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <p className="text-xs text-muted-foreground">
            {t("common.page", { page: data.page, total: data.totalPages })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => onPageChange(data.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => onPageChange(data.page + 1)}
            >
              {t("common.next")}
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
