import { Cpu, Hash, Pencil, Tag } from "lucide-react";
import { useI18n } from "@/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import type { Equipment } from "@/lib/lis-api";

export function EquipmentCard({
  equipment,
  onReserve,
  isAdmin,
  onEdit,
}: {
  equipment: Equipment;
  onReserve: (equipment: Equipment) => void;
  isAdmin?: boolean;
  onEdit?: (equipment: Equipment) => void;
}) {
  const { t } = useI18n();
  const disabled = equipment.status !== "available";

  const onPointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <article
      onPointerMove={onPointerMove}
      className="glass spotlight group flex h-full flex-col rounded-3xl p-5 duration-500 hover:border-primary/40 hover:shadow-[var(--shadow-glow)]"
    >
      <div className="relative z-10 flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            <Hash className="h-3 w-3 shrink-0" />
            {equipment.id}
          </p>
          <h3 className="mt-1 truncate text-lg font-semibold text-foreground">{equipment.name}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {isAdmin && onEdit && (
            <button
              type="button"
              onClick={() => onEdit(equipment)}
              aria-label={t("equipmentForm.editButton")}
              className="grid h-9 w-9 place-items-center rounded-2xl bg-secondary/50 text-muted-foreground transition-colors hover:text-foreground"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary transition-transform duration-500 group-hover:rotate-6">
            <Cpu className="h-5 w-5" />
          </span>
        </div>
      </div>

      <div className="relative z-10 mt-4 space-y-2 text-sm">
        <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <Tag className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{equipment.category}</span>
        </p>
        <p className="truncate font-mono text-xs text-muted-foreground/80">
          {t("equipment.serial")}: {equipment.serial}
        </p>
      </div>

      <div className="relative z-10 mt-5 flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status={equipment.status} />
        <Button
          size="sm"
          disabled={disabled}
          onClick={() => onReserve(equipment)}
          className="rounded-full px-4 transition-all duration-300 disabled:opacity-40"
        >
          {disabled ? t("equipment.unavailable") : t("equipment.reserve")}
        </Button>
      </div>
    </article>
  );
}