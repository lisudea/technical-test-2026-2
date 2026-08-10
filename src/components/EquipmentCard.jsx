import { Pencil, Trash2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { getCategoryIcon, getEquipoStatusClass } from "../utils/equipoUi";
import StatusBadge from "./StatusBadge";

export default function EquipmentCard({ equipo, onReserve, onEdit, onDelete }) {
  const { t } = useLanguage();
  const Icon = getCategoryIcon(equipo.categoria);
  const statusClass = getEquipoStatusClass(equipo.estadoVisual);
  const isAvailable = equipo.estadoVisual === "DISPONIBLE";

  return (
    <div className={`equipment-card border-${statusClass}`}>
      <div className="equipment-card-top">
        <div className="equipment-card-heading">
          <div className="equipment-icon-square">
            <Icon size={20} />
          </div>
          <div>
            <div className="equipment-name">{equipo.nombre}</div>
            <div className="equipment-code">{equipo.codigo}</div>
          </div>
        </div>
        <StatusBadge label={t(`equipoEstado.${equipo.estadoVisual}`)} tone={statusClass} />
      </div>

      <div className="equipment-card-details">
        <div>
          <span className="detail-label">{t("dashboard.serial")}</span>{" "}
          <span className="detail-value">{equipo.numeroSerie}</span>
        </div>
        <div>
          <span className="detail-label">{t("dashboard.category")}</span>{" "}
          <span className="detail-value">{t(`categories.${equipo.categoria}`)}</span>
        </div>
      </div>

      <div className="equipment-card-actions">
        <button
          type="button"
          className="btn btn-reserve"
          disabled={!isAvailable}
          title={isAvailable ? t("dashboard.reserve") : t("dashboard.notAvailable")}
          onClick={() => onReserve(equipo)}
        >
          {t("dashboard.reserve")}
        </button>
        <button
          type="button"
          className="btn-icon"
          aria-label={t("common.edit")}
          onClick={() => onEdit(equipo)}
        >
          <Pencil size={16} />
        </button>
        <button
          type="button"
          className="btn-icon btn-icon-danger"
          aria-label={t("common.delete")}
          onClick={() => onDelete(equipo)}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
