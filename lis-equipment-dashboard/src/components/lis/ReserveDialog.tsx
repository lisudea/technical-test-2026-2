import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "@/i18n/I18nProvider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "./DateTimePicker";
import {
  ApiError,
  createReservation,
  fetchReservationsForEquipment,
  type Equipment,
} from "@/lib/lis-api";

function expandDaysBetween(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const last = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cursor <= last) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export function ReserveDialog({
  equipment,
  onOpenChange,
  onSuccess,
}: {
  equipment: Equipment | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const { t } = useI18n();
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");

  const busyQuery = useQuery({
    queryKey: ["equipment-reservations", equipment?.id],
    queryFn: () => fetchReservationsForEquipment(equipment!.id),
    enabled: Boolean(equipment),
  });

  const busyRanges = busyQuery.data ?? [];
  const busyDates = useMemo(
    () => busyRanges.flatMap((r) => expandDaysBetween(new Date(r.startAt), new Date(r.endAt))),
    [busyRanges],
  );

  const mutation = useMutation({
    mutationFn: createReservation,
    onSuccess: () => {
      toast.success(t("reserve.success"));
      onSuccess();
      onOpenChange(false);
      setStartAt("");
      setEndAt("");
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        toast.error(t(error.messageKey), { description: error.detail });
      } else {
        toast.error(t("error.server"));
      }
    },
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!equipment) return;
    if (!startAt || !endAt) {
      toast.error(t("reserve.errorFields"));
      return;
    }
    if (new Date(endAt) <= new Date(startAt)) {
      toast.error(t("reserve.errorRange"));
      return;
    }
    mutation.mutate({ equipmentId: equipment.id, startAt, endAt });
  };

  return (
    <Dialog open={Boolean(equipment)} onOpenChange={onOpenChange}>
      <DialogContent className="glass rounded-3xl border-border/70 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("reserve.title", { name: equipment?.name ?? "" })}</DialogTitle>
          <DialogDescription>{t("reserve.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("reserve.start")}</Label>
            <DateTimePicker value={startAt} onChange={setStartAt} busyDates={busyDates} />
          </div>
          <div className="space-y-2">
            <Label>{t("reserve.end")}</Label>
            <DateTimePicker value={endAt} onChange={setEndAt} busyDates={busyDates} />
          </div>

          {busyRanges.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-secondary/20 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {t("reserve.busyTitle")}
              </p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                {busyRanges.map((r) => (
                  <li key={r.id}>
                    {new Date(r.startAt).toLocaleString()} — {new Date(r.endAt).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
              {t("reserve.cancel")}
            </Button>
            <Button type="submit" className="rounded-full" disabled={mutation.isPending}>
              {mutation.isPending ? t("reserve.sending") : t("reserve.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}