import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState } from "@/components/common/states";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Skeleton } from "@/components/ui/skeleton";
import { statisticsService } from "@/services";

export const Route = createFileRoute("/estadisticas")({
  head: () => ({
    meta: [
      { title: "Estadísticas de uso · LISource" },
      {
        name: "description",
        content:
          "Equipos más reservados del Laboratorio Integrado de Sistemas y métricas de uso del inventario.",
      },
      { property: "og:title", content: "Estadísticas de uso · LISource" },
      {
        property: "og:description",
        content: "Top 5 de equipos más solicitados en el LIS.",
      },
    ],
  }),
  component: StatisticsPage,
});

function StatisticsPage() {
  const { t } = useTranslation();
  const query = useQuery({
    queryKey: ["stats", "top"],
    queryFn: () => statisticsService.topEquipment(),
  });

  const max = Math.max(1, ...(query.data ?? []).map((item) => item.reservations));

  return (
    <AppShell title={t("statistics.title")}>
      <PageHeader title={t("statistics.title")} subtitle={t("statistics.subtitle")} />

      <section className="surface-card p-6">
        <div className="flex items-start gap-3 sm:items-center">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand-dark">
            <Trophy className="h-4.5 w-4.5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold">{t("statistics.top5")}</h2>
            <p className="text-sm text-muted-foreground">{t("statistics.top5Subtitle")}</p>
          </div>
        </div>

        <div className="mt-6">
          {query.isLoading ? (
            <ul className="space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <li key={index}>
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="mt-2 h-2.5 w-full rounded-full" />
                </li>
              ))}
            </ul>
          ) : query.isError ? (
            <ErrorState
              title={t("states.errorTitle")}
              description={t("states.errorText")}
              actionLabel={t("common.retry")}
              onRetry={() => void query.refetch()}
            />
          ) : (query.data?.length ?? 0) === 0 ? (
            <EmptyState title={t("states.emptyTitle")} description={t("states.emptyText")} />
          ) : (
            <ol className="space-y-5">
              {query.data?.map((item, index) => (
                <li key={item.equipmentId}>
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <p className="break-words text-sm font-medium">
                      <span className="mr-2 text-muted-foreground tabular-nums">{index + 1}.</span>
                      {item.name}
                    </p>
                    <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
                      {t("statistics.reservationsCount", { count: item.reservations })}
                    </p>
                  </div>
                  <div
                    className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted"
                    role="presentation"
                  >
                    <div
                      className="h-full rounded-full bg-brand transition-all"
                      style={{ width: `${Math.round((item.reservations / max) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </AppShell>
  );
}
