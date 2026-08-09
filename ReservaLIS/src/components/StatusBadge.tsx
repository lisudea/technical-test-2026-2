import type { EquipoStatus } from "@/data/mock";
import { t } from "@/i18n/es";

const config: Record<EquipoStatus, { bg: string; text: string; dot: string; label: string }> = {
  disponible: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", label: t.status.disponible },
  reservado: { bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", label: t.status.reservado },
  mantenimiento: { bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400", label: t.status.mantenimiento },
  baja: { bg: "bg-gray-900", text: "text-gray-100", dot: "bg-gray-500", label: t.status.baja },
};

export function StatusBadge({ status }: { status: EquipoStatus }) {
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}
