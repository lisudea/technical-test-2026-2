import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarClock, CheckCircle2, Cpu, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

import { MetricsSkeleton } from "@/components/common/states";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { EquipmentList } from "@/features/equipment/equipment-list";
import { useEquipmentList } from "@/features/equipment/use-equipment";
import { statisticsService } from "@/services";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Panel de recursos · LISource" },
      {
        name: "description",
        content:
          "Panel general del Laboratorio Integrado de Sistemas: equipos disponibles, reservados y en mantenimiento.",
      },
      { property: "og:title", content: "Panel de recursos · LISource" },
      {
        property: "og:description",
        content:
          "Panel general del Laboratorio Integrado de Sistemas: equipos disponibles, reservados y en mantenimiento.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation();
  const stats = useQuery({
    queryKey: ["stats", "dashboard"],
    queryFn: () => statisticsService.dashboard(),
  });
  const equipment = useEquipmentList({ pageSize: 5 });

  const cards = [
    {
      key: "total",
      label: t("dashboard.total"),
      value: stats.data?.total,
      icon: Cpu,
      tone: "bg-brand-soft text-brand-dark",
    },
    {
      key: "available",
      label: t("dashboard.available"),
      value: stats.data?.available,
      icon: CheckCircle2,
      tone: "bg-success-soft text-success",
    },
    {
      key: "reserved",
      label: t("dashboard.reserved"),
      value: stats.data?.reserved,
      icon: CalendarClock,
      tone: "bg-danger-soft text-danger",
    },
    {
      key: "maintenance",
      label: t("dashboard.maintenance"),
      value: stats.data?.maintenance,
      icon: Wrench,
      tone: "bg-neutral-status-soft text-neutral-status",
    },
  ];

  return (
    <AppShell title={t("dashboard.title")}>
      <PageHeader title={t("dashboard.title")} subtitle={t("dashboard.subtitle")} />

      {stats.isLoading ? (
        <MetricsSkeleton />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <article key={card.key} className="surface-card p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tone}`}
                >
                  <card.icon className="h-4.5 w-4.5" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-semibold tabular-nums">{card.value ?? "—"}</p>
            </article>
          ))}
        </div>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold tracking-tight">{t("dashboard.inventory")}</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/equipos">
              {t("dashboard.viewAll")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <EquipmentList
          data={equipment.data}
          isLoading={equipment.isLoading}
          isError={equipment.isError}
          onRetry={() => void equipment.refetch()}
          onClearFilters={() => void equipment.refetch()}
        />
      </section>
    </AppShell>
  );
}
