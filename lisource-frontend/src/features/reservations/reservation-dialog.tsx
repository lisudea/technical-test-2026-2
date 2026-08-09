import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, CheckCircle2, Loader2, MapPin } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api-error";
import { combineDateTime, formatDate, formatRange, toDateInput } from "@/lib/format";
import { reservationService } from "@/services";
import type { EquipmentDto, ReservationDto } from "@/types";

interface FormState {
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  notes: string;
}

type Errors = Partial<Record<keyof FormState | "range", string>>;

function initialState(): FormState {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const date = toDateInput(tomorrow);
  return { startDate: date, startTime: "10:00", endDate: date, endTime: "12:00", notes: "" };
}

export function ReservationDialog({
  equipment,
  open,
  onOpenChange,
}: {
  equipment: EquipmentDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Errors>({});
  const [conflict, setConflict] = useState(false);
  const [created, setCreated] = useState<ReservationDto | null>(null);

  const busy = useQuery({
    queryKey: ["reservations", "busy", equipment.id],
    queryFn: () => reservationService.busySlots(equipment.id),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setErrors({});
      setConflict(false);
      setCreated(null);
    }
  }, [open]);

  const mutation = useMutation({
    mutationFn: () =>
      reservationService.create({
        equipmentIds: [equipment.id],
        startsAt: combineDateTime(form.startDate, form.startTime).toISOString(),
        endsAt: combineDateTime(form.endDate, form.endTime).toISOString(),
        notes: form.notes,
      }),
    onSuccess: (reservation) => {
      setConflict(false);
      setCreated(reservation);
      void queryClient.invalidateQueries({ queryKey: ["reservations"] });
      void queryClient.invalidateQueries({ queryKey: ["equipment"] });
      void queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(t("reservations.success"), { description: t("reservations.successText") });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setConflict(true);
        toast.error(t("reservations.conflictTitle"), { description: t("errors.conflict") });
        return;
      }
      toast.error(t(error instanceof ApiError ? error.messageKey : "errors.unknown"));
    },
  });

  const update = (patch: Partial<FormState>) => {
    setForm((previous) => ({ ...previous, ...patch }));
    setConflict(false);
  };

  const validate = (): boolean => {
    const next: Errors = {};
    if (!form.startDate) next.startDate = t("reservations.validation.startDate");
    if (!form.startTime) next.startTime = t("reservations.validation.startTime");
    if (!form.endDate) next.endDate = t("reservations.validation.endDate");
    if (!form.endTime) next.endTime = t("reservations.validation.endTime");
    if (form.startDate && form.startTime && form.endDate && form.endTime) {
      const start = combineDateTime(form.startDate, form.startTime);
      const end = combineDateTime(form.endDate, form.endTime);
      if (end <= start) next.range = t("reservations.validation.order");
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mutation.isPending) return;
    if (!validate()) return;
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {created ? (
          <div className="space-y-5">
            <DialogHeader>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-success-soft text-success">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
              </span>
              <DialogTitle>{t("reservations.success")}</DialogTitle>
              <DialogDescription>{t("reservations.successText")}</DialogDescription>
            </DialogHeader>
            <dl className="surface-card space-y-2 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("reservations.code")}</dt>
                <dd className="font-mono font-medium">{created.code}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("equipment.name")}</dt>
                <dd className="text-right font-medium">{equipment.name}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("reservations.startDate")}</dt>
                <dd className="text-right">{formatDate(created.startsAt, i18n.language)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{t("reservations.scheduleColumn")}</dt>
                <dd className="text-right">
                  {formatRange(created.startsAt, created.endsAt, i18n.language)}
                </dd>
              </div>
            </dl>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.close")}
              </Button>
              <Button asChild>
                <Link to="/reservas">{t("reservations.viewMine")}</Link>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="space-y-5">
            <DialogHeader>
              <DialogTitle>{t("reservations.createTitle")}</DialogTitle>
              <DialogDescription>{t("reservations.createSubtitle")}</DialogDescription>
            </DialogHeader>

            <div className="surface-card bg-brand-soft/60 p-4 text-sm">
              <p className="font-medium">{equipment.name}</p>
              <p className="font-mono text-xs text-muted-foreground">{equipment.inventoryCode}</p>
              {equipment.location ? (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {equipment.location.name}
                </p>
              ) : null}
            </div>

            {busy.data && busy.data.length > 0 ? (
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                <p className="mb-1 inline-flex items-center gap-1.5 font-medium text-foreground">
                  <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("reservations.hint")}
                </p>
                <ul className="space-y-0.5">
                  {busy.data.slice(0, 3).map((slot) => (
                    <li key={slot.startsAt}>
                      {formatDate(slot.startsAt, i18n.language)} ·{" "}
                      {formatRange(slot.startsAt, slot.endsAt, i18n.language)}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {conflict ? (
              <div
                role="alert"
                className="flex gap-3 rounded-lg border border-danger/30 bg-danger-soft p-4"
              >
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
                <div>
                  <p className="text-sm font-semibold text-danger">
                    {t("reservations.conflictTitle")}
                  </p>
                  <p className="mt-1 text-sm text-danger/90">{t("reservations.conflict")}</p>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">{t("reservations.startDate")}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(event) => update({ startDate: event.target.value })}
                  aria-invalid={Boolean(errors.startDate)}
                />
                {errors.startDate ? (
                  <p className="text-xs text-danger">{errors.startDate}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startTime">{t("reservations.startTime")}</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={form.startTime}
                  onChange={(event) => update({ startTime: event.target.value })}
                  aria-invalid={Boolean(errors.startTime)}
                />
                {errors.startTime ? (
                  <p className="text-xs text-danger">{errors.startTime}</p>
                ) : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">{t("reservations.endDate")}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={form.endDate}
                  onChange={(event) => update({ endDate: event.target.value })}
                  aria-invalid={Boolean(errors.endDate)}
                />
                {errors.endDate ? <p className="text-xs text-danger">{errors.endDate}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endTime">{t("reservations.endTime")}</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={form.endTime}
                  onChange={(event) => update({ endTime: event.target.value })}
                  aria-invalid={Boolean(errors.endTime)}
                />
                {errors.endTime ? <p className="text-xs text-danger">{errors.endTime}</p> : null}
              </div>
            </div>
            {errors.range ? (
              <p className="text-xs text-danger" role="alert">
                {errors.range}
              </p>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="notes">
                {t("reservations.notes")}{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  ({t("common.optional")})
                </span>
              </Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                placeholder={t("reservations.notesPlaceholder")}
                onChange={(event) => update({ notes: event.target.value })}
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    {t("reservations.submitting")}
                  </>
                ) : (
                  t("reservations.confirm")
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
