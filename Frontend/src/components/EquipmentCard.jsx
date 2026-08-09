import { useI18n } from "../i18n/I18nContext";
import StatusLed from "./StatusLed";

export default function EquipmentCard({ equipo, onReserve }) {
  const { t } = useI18n();
  const disponible = equipo.estado === "disponible";

  return (
    <div className="group relative bg-panel border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-teal/40 transition-colors">
      {/* tornillos decorativos, como una placa física */}
      <span className="absolute top-2 left-2 w-1 h-1 rounded-full bg-border" />
      <span className="absolute top-2 right-2 w-1 h-1 rounded-full bg-border" />
      <span className="absolute bottom-2 left-2 w-1 h-1 rounded-full bg-border" />
      <span className="absolute bottom-2 right-2 w-1 h-1 rounded-full bg-border" />

      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-mono text-sm font-semibold text-text leading-tight break-words">{equipo.nombre}</h3>
          <p className="text-[11px] text-textdim font-mono mt-1">
            {t(`category_${equipo.categoria}`)}
          </p>
        </div>
        <StatusLed estado={equipo.estado} label={t(`status_${equipo.estado}`)} />
      </div>

      <div className="text-[11px] font-mono text-textdim border-t border-border pt-2">
        {t("serial")}: <span className="text-textdim/90">{equipo.numero_serie_o_mac}</span>
      </div>

      <button
        onClick={() => onReserve(equipo)}
        disabled={!disponible}
        className={`mt-1 w-full py-2 rounded-lg text-xs font-mono font-semibold tracking-wide transition-colors
          ${disponible
            ? "bg-teal/10 text-teal border border-teal/40 hover:bg-teal/20"
            : "bg-white/5 text-textdim/50 border border-border cursor-not-allowed"}`}
      >
        {t("reserve")}
      </button>
    </div>
  );
}
