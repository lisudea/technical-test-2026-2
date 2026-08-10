import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CalendarPlus, Cpu } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { EmptyState, ErrorState } from "@/components/common/states";
import { StatusBadge } from "@/components/common/status-badge";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEquipmentDetail } from "@/features/equipment/use-equipment";
import { ReservationDialog } from "@/features/reservations/reservation-dialog";
import { ApiError } from "@/lib/api-error";
import type { VisualStatus } from "@/types";

export const Route = createFileRoute("/equipos/$equipmentId")({
  head: () => ({
    meta: [
      { title: "Detalle del equipo · LISource" },
      {
        name: "description",
        content:
          "Ficha técnica del equipo: categoría, ubicación, número de serie y disponibilidad para reserva.",
      },
      { property: "og:title", content: "Detalle del equipo · LISource" },
      {
        property: "og:description",
        content: "Consulta la ficha técnica y reserva el equipo del LIS.",
      },
    ],
  }),
  component: EquipmentDetailPage,
});

const unavailableKey: Partial<Record<VisualStatus, string>> = {
  RESERVED: "equipment.currentlyReserved",
  MAINTENANCE: "equipment.currentlyMaintenance",
  OUT_OF_SERVICE: "equipment.currentlyOutOfService",
  RETIRED: "equipment.currentlyRetired",
};

function EquipmentDetailPage() {
  const { t } = useTranslation();
  const { equipmentId } = useParams({ from: "/equipos/$equipmentId" });
  const query = useEquipmentDetail(Number(equipmentId));
  const [dialogOpen, setDialogOpen] = useState(false);

  const equipment = query.data;
  const notFound = query.error instanceof ApiError && query.error.status === 404;

  return (
    <AppShell title={equipment?.name ?? t("equipment.title")}>
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link to="/equipos">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {t("equipment.backToList")}
        </Link>
      </Button>

      {query.isLoading ? (
        <div className="surface-card space-y-4 p-6">
          <Skeleton className="h-7 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : notFound ? (
        <div className="surface-card">
          <EmptyState
            title={t("equipment.notFoundTitle")}
            description={t("equipment.notFoundText")}
            action={
              <Button asChild variant="outline">
                <Link to="/equipos">{t("equipment.backToList")}</Link>
              </Button>
            }
          />
        </div>
      ) : query.isError || !equipment ? (
        <div className="surface-card">
          <ErrorState
            title={t("states.errorTitle")}
            description={t("states.errorText")}
            actionLabel={t("common.retry")}
            onRetry={() => void query.refetch()}
          />
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-start">
          <article className="surface-card overflow-hidden">
            <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand-dark"
                >
                  <Cpu className="h-7 w-7" />
                </span>
                <div className="min-w-0">
                  <h2 className="break-words text-xl font-semibold tracking-tight">
                    {equipment.name}
                  </h2>
                  <p className="break-all font-mono text-sm text-muted-foreground">
                    {equipment.inventoryCode}
                  </p>
                </div>
              </div>
              <StatusBadge status={equipment.visualStatus} />
            </div>

            {equipment.imageUrl ? (
              <div className="border-b border-border bg-muted/20 p-6">
                <img
                  src={equipment.imageUrl}
                  alt={`${t("equipment.image")}: ${equipment.name}`}
                  className="max-h-80 w-full rounded-xl object-contain"
                  onError={(event) => {
                    event.currentTarget.hidden = true;
                  }}
                />
              </div>
            ) : null}

            {equipment.description ? (
              <div className="border-b border-border p-6">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t("equipment.description")}
                </h3>
                <p className="mt-2 break-words text-sm leading-relaxed">{equipment.description}</p>
              </div>
            ) : null}

            <dl className="grid gap-x-8 gap-y-5 p-6 sm:grid-cols-2">
              <Field label={t("equipment.category")} value={equipment.category.name} />
              <Field
                label={t("equipment.location")}
                value={equipment.location?.name ?? t("common.notAvailable")}
              />
              <Field
                label={t("equipment.serialNumber")}
                value={equipment.serialNumber ?? t("common.notAvailable")}
                mono
              />
              <Field
                label={t("equipment.macAddress")}
                value={equipment.macAddress ?? t("common.notAvailable")}
                mono
              />
              <Field
                label={t("equipment.operationalStatus")}
                value={t(`equipment.operational.${equipment.operationalStatus.code}`)}
              />
            </dl>
          </article>

          <aside className="surface-card p-6">
            <h3 className="text-base font-semibold">{t("equipment.availability")}</h3>
            <div className="mt-3">
              <StatusBadge status={equipment.visualStatus} />
            </div>
            {equipment.visualStatus === "AVAILABLE" ? (
              <Button className="mt-5 w-full" onClick={() => setDialogOpen(true)}>
                <CalendarPlus className="h-4 w-4" aria-hidden="true" />
                {t("equipment.reserve")}
              </Button>
            ) : (
              <>
                <p className="mt-4 text-sm text-muted-foreground">
                  {t(unavailableKey[equipment.visualStatus] ?? "equipment.currentlyReserved")}
                </p>
                <Button className="mt-4 w-full" disabled>
                  {t("equipment.reserve")}
                </Button>
              </>
            )}
          </aside>

          <ReservationDialog equipment={equipment} open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>
      )}
    </AppShell>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className={`mt-1 break-words text-sm ${mono ? "break-all font-mono" : ""}`}>{value}</dd>
    </div>
  );
}
