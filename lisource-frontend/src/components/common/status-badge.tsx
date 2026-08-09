import { AlertTriangle, Archive, CalendarClock, CheckCircle2, Wrench } from "lucide-react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import type { ReservationVisualStatus, VisualStatus } from "@/types";

const equipmentStyles: Record<
  VisualStatus,
  { icon: typeof CheckCircle2; label: string; className: string }
> = {
  AVAILABLE: {
    icon: CheckCircle2,
    label: "equipment.available",
    className: "bg-success-soft text-success border-success/25",
  },
  RESERVED: {
    icon: CalendarClock,
    label: "equipment.reserved",
    className: "bg-danger-soft text-danger border-danger/25",
  },
  MAINTENANCE: {
    icon: Wrench,
    label: "equipment.maintenance",
    className: "bg-neutral-status-soft text-neutral-status border-neutral-status/25",
  },
  OUT_OF_SERVICE: {
    icon: AlertTriangle,
    label: "equipment.outOfService",
    className: "bg-warning-soft text-warning border-warning/30",
  },
  RETIRED: {
    icon: Archive,
    label: "equipment.retired",
    className: "bg-muted text-foreground/70 border-border",
  },
};

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap";

export function StatusBadge({ status, className }: { status: VisualStatus; className?: string }) {
  const { t } = useTranslation();
  const config = equipmentStyles[status];
  const Icon = config.icon;
  return (
    <span className={cn(base, config.className, className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {t(config.label)}
    </span>
  );
}

const reservationStyles: Record<ReservationVisualStatus, string> = {
  UPCOMING: "bg-brand-soft text-brand-dark border-brand/30",
  IN_PROGRESS: "bg-success-soft text-success border-success/25",
  FINISHED: "bg-muted text-foreground/70 border-border",
  CANCELLED: "bg-danger-soft text-danger border-danger/25",
};

export function ReservationStatusBadge({ status }: { status: ReservationVisualStatus }) {
  const { t } = useTranslation();
  return (
    <span className={cn(base, reservationStyles[status])}>
      {t(`reservations.status.${status}`)}
    </span>
  );
}
