import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarClock, Loader2 } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { EmptyState, ErrorState } from "@/components/common/states";
import { ReservationStatusBadge } from "@/components/common/status-badge";
import { AppShell, PageHeader } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-error";
import { formatDate, formatRange } from "@/lib/format";
import { reservationVisualStatus } from "@/lib/reservation-status";
import { reservationService } from "@/services";
import type { ReservationDto, ReservationVisualStatus } from "@/types";

export const Route = createFileRoute("/reservas")({
  head: () => ({
    meta: [
      { title: "Mis reservas · LISource" },
      {
        name: "description",
        content:
          "Consulta el historial de tus reservas de equipos del LIS y cancela las que ya no necesites.",
      },
      { property: "og:title", content: "Mis reservas · LISource" },
      {
        property: "og:description",
        content: "Gestiona tus reservas de equipos del Laboratorio Integrado de Sistemas.",
      },
    ],
  }),
  component: ReservationsPage,
});

const tabs: Array<{ value: ReservationVisualStatus | "ALL"; labelKey: string }> = [
  { value: "ALL", labelKey: "common.all" },
  { value: "UPCOMING", labelKey: "reservations.tabs.upcoming" },
  { value: "IN_PROGRESS", labelKey: "reservations.tabs.inProgress" },
  { value: "FINISHED", labelKey: "reservations.tabs.finished" },
  { value: "CANCELLED", labelKey: "reservations.tabs.cancelled" },
];

function ReservationsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ReservationVisualStatus | "ALL">("ALL");
  const [target, setTarget] = useState<ReservationDto | null>(null);
  const [reason, setReason] = useState("");

  const query = useQuery({
    queryKey: ["reservations", "mine"],
    queryFn: () => reservationService.listMine(),
  });

  const cancelMutation = useMutation({
    mutationFn: (input: { id: number; reason: string }) =>
      reservationService.cancel(input.id, input.reason),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
      void queryClient.invalidateQueries({ queryKey: ["equipment"] });
      setTarget(null);
      setReason("");
      toast.success(t("reservations.cancelled"));
    },
    onError: (error) => {
      toast.error(t(error instanceof ApiError ? error.messageKey : "errors.unknown"));
    },
  });

  const items = (query.data ?? []).filter(
    (reservation) => tab === "ALL" || reservationVisualStatus(reservation) === tab,
  );

  return (
    <AppShell title={t("reservations.title")}>
      <PageHeader
        title={t("reservations.title")}
        subtitle={t("reservations.subtitle")}
        actions={
          <Button asChild>
            <Link to="/equipos">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
              {t("reservations.create")}
            </Link>
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="mb-4">
        <TabsList className="flex-wrap">
          {tabs.map((item) => (
            <TabsTrigger key={item.value} value={item.value}>
              {t(item.labelKey)}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {query.isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="surface-card p-5">
              <Skeleton className="h-4 w-52" />
              <Skeleton className="mt-3 h-3 w-40" />
              <Skeleton className="mt-4 h-7 w-28 rounded-full" />
            </div>
          ))}
        </div>
      ) : query.isError ? (
        <div className="surface-card">
          <ErrorState
            title={t("states.errorTitle")}
            description={t("states.errorText")}
            actionLabel={t("common.retry")}
            onRetry={() => void query.refetch()}
          />
        </div>
      ) : items.length === 0 ? (
        <div className="surface-card">
          <EmptyState
            title={t("reservations.emptyTitle")}
            description={t("reservations.emptyText")}
            action={
              <Button asChild variant="outline">
                <Link to="/equipos">{t("reservations.create")}</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((reservation) => {
            const status = reservationVisualStatus(reservation);
            return (
              <li key={reservation.id} className="surface-card p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {reservation.code}
                      </span>
                      <ReservationStatusBadge status={status} />
                    </div>
                    <p className="mt-2 font-medium">
                      {reservation.equipment.map((item) => item.name).join(" · ")}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDate(reservation.startsAt, i18n.language)} ·{" "}
                      {formatRange(reservation.startsAt, reservation.endsAt, i18n.language)}
                    </p>
                    {reservation.notes ? (
                      <p className="mt-2 text-sm text-muted-foreground">{reservation.notes}</p>
                    ) : null}
                    {reservation.cancellationReason ? (
                      <p className="mt-2 text-sm text-danger">{reservation.cancellationReason}</p>
                    ) : null}
                  </div>
                  {status === "UPCOMING" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => {
                        setTarget(reservation);
                        setReason("");
                      }}
                    >
                      {t("reservations.cancel")}
                    </Button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("reservations.cancelTitle")}</DialogTitle>
            <DialogDescription>{t("reservations.cancelText")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="cancel-reason">
              {t("reservations.cancelReason")}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                ({t("common.optional")})
              </span>
            </Label>
            <Textarea
              id="cancel-reason"
              rows={3}
              value={reason}
              placeholder={t("reservations.cancelReasonPlaceholder")}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTarget(null)}>
              {t("common.back")}
            </Button>
            <Button
              variant="destructive"
              disabled={cancelMutation.isPending}
              onClick={() => target && cancelMutation.mutate({ id: target.id, reason })}
            >
              {cancelMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t("reservations.cancelConfirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
