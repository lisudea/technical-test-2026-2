import { Ban, CheckCircle2, Lock, Wrench } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import type { EquipmentStatus } from "@/lib/lis-api";
import { cn } from "@/lib/utils";

function getStatusConfig(status: EquipmentStatus) {
  if (status === "available") {
    return {
      icon: CheckCircle2,
      text: "text-available",
      dot: "bg-available",
      ring: "border-available/40 bg-available/10",
    };
  }
  if (status === "reserved") {
    return {
      icon: Lock,
      text: "text-reserved",
      dot: "bg-reserved",
      ring: "border-reserved/40 bg-reserved/10",
    };
  }
  if (status === "maintenance") {
    return {
      icon: Wrench,
      text: "text-maintenance",
      dot: "bg-maintenance",
      ring: "border-maintenance/40 bg-maintenance/10",
    };
  }
  return {
    icon: Ban,
    text: "text-destructive",
    dot: "bg-destructive",
    ring: "border-destructive/40 bg-destructive/10",
  };
}

export function StatusBadge({ status }: { status: EquipmentStatus }) {
  const { t } = useI18n();
  const cfg = getStatusConfig(status);
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
        cfg.ring,
        cfg.text,
      )}
    >
      <span className={cn("status-dot h-2 w-2 shrink-0 rounded-full", cfg.dot)} />
      <Icon className="h-3.5 w-3.5 shrink-0" />
      {t(`status.${status}` as const)}
    </span>
  );
}