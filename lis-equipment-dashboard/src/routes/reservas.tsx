import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, XCircle } from "lucide-react";
import { CursorAura } from "@/components/lis/CursorAura";
import { Reveal } from "@/components/lis/Reveal";
import { Header, NavTabs } from "@/components/lis/Header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/i18n/I18nProvider";
import { useAuth } from "@/lib/auth-context";
import { ApiError, cancelReservation, fetchReservations, type Reservation } from "@/lib/lis-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reservas")({
  head: () => ({ meta: [{ title: "Reservas — Panel LIS" }] }),
  component: ReservationsPage,
});

function ReservationsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const query = useQuery({ queryKey: ["reservations-all"], queryFn: fetchReservations });

  async function handleCancel(reservation: Reservation) {
    setCancellingId(reservation.id);
    try {
      await cancelReservation(reservation.id);
      toast.success(t("reservations.cancelSuccess"));
      void queryClient.invalidateQueries({ queryKey: ["reservations-all"] });
      void queryClient.invalidateQueries({ queryKey: ["reservations-active"] });
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(t(error.messageKey), { description: error.detail });
      } else {
        toast.error(t("error.server"));
      }
    } finally {
      setCancellingId(null);
    }
  }

  function canCancel(reservation: Reservation) {
    if (!user) return false;
    if (reservation.status !== "ACTIVE") return false;
    return user.role === "ADMIN" || user.email === reservation.userEmail;
  }

  const items = query.data ?? [];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <CursorAura />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        <Header />
        <NavTabs />

        <Reveal className="mt-8" delay={60}>
          <h2 className="text-xl font-bold">{t("reservations.title")}</h2>
        </Reveal>

        <Reveal className="mt-6" delay={100}>
          {query.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-20 rounded-2xl bg-card/60" />
              ))}
            </div>
          ) : query.isError ? (
            <div className="glass rounded-3xl px-6 py-14 text-center text-sm text-muted-foreground">
              {t("error.loadTitle")}
            </div>
          ) : items.length === 0 ? (
            <div className="glass rounded-3xl px-6 py-14 text-center text-sm text-muted-foreground">
              {t("reservations.empty")}
            </div>
          ) : (
            <div className="glass overflow-hidden rounded-3xl overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border/60 text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-3 font-medium">{t("reservations.table.equipment")}</th>
                    <th className="px-5 py-3 font-medium">{t("reservations.table.reservedBy")}</th>
                    <th className="px-5 py-3 font-medium">{t("reservations.table.start")}</th>
                    <th className="px-5 py-3 font-medium">{t("reservations.table.end")}</th>
                    <th className="px-5 py-3 font-medium">{t("reservations.table.status")}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-b border-border/40 last:border-0">
                      <td className="px-5 py-4">{r.equipmentName}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span>{r.userName}</span>
                          <span className="text-xs text-muted-foreground">{r.userEmail}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(r.startAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">
                        {new Date(r.endAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                            r.status === "ACTIVE"
                              ? "border-available/40 bg-available/10 text-available"
                              : "border-border/60 bg-secondary/40 text-muted-foreground",
                          )}
                        >
                          <CalendarClock className="h-3 w-3" />
                          {r.status === "ACTIVE"
                            ? t("reservations.status.active")
                            : t("reservations.status.cancelled")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        {canCancel(r) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={cancellingId === r.id}
                            onClick={() => handleCancel(r)}
                            className="rounded-full text-destructive hover:text-destructive"
                          >
                            <XCircle className="mr-1.5 h-3.5 w-3.5" />
                            {cancellingId === r.id ? t("reservations.cancelling") : t("reservations.cancel")}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Reveal>
      </div>
    </main>
  );
}