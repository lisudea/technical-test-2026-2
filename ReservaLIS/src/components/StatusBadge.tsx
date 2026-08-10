import type { EquipoStatus } from "@/api/types";
import { useTranslation } from "@/context/LanguageContext";

const COLORS: Record<EquipoStatus, { bg: string; text: string; dot: string }> = {
  disponible:    { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-500" },
  reservado:     { bg: "bg-amber-50",  text: "text-amber-700",  dot: "bg-amber-400" },
  mantenimiento: { bg: "bg-gray-100",  text: "text-gray-600",   dot: "bg-gray-400"  },
  baja:          { bg: "bg-gray-900",  text: "text-gray-100",   dot: "bg-gray-500"  },
};

export function StatusBadge({ status }: { status: EquipoStatus }) {
  const { t } = useTranslation();
  const labels: Record<EquipoStatus, string> = {
    disponible:    t.status.disponible,
    reservado:     t.status.reservado,
    mantenimiento: t.status.mantenimiento,
    baja:          t.status.baja,
  };
  const c = COLORS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {labels[status]}
    </span>
  );
}
