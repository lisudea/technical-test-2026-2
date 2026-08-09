import { useI18n } from "../i18n/I18nContext";

const CATEGORIES = ["microcontroladores", "vr", "redes", "otros"];
const STATUSES = ["disponible", "reservado", "mantenimiento"];

export default function Filters({ categoria, estado, onCategoria, onEstado }) {
  const { t, lang, setLang } = useI18n();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-mono uppercase tracking-wide text-textdim">{t("filterCategory")}</label>
        <select
          value={categoria}
          onChange={(e) => onCategoria(e.target.value)}
          className="bg-panel2 border border-border rounded-lg px-3 py-2 text-sm font-mono text-text focus:outline-none focus:ring-1 focus:ring-teal"
        >
          <option value="">{t("allCategories")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{t(`category_${c}`)}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-mono uppercase tracking-wide text-textdim">{t("filterStatus")}</label>
        <select
          value={estado}
          onChange={(e) => onEstado(e.target.value)}
          className="bg-panel2 border border-border rounded-lg px-3 py-2 text-sm font-mono text-text focus:outline-none focus:ring-1 focus:ring-teal"
        >
          <option value="">{t("allStatuses")}</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{t(`status_${s}`)}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 ml-auto">
        <label className="text-[10px] font-mono uppercase tracking-wide text-textdim">Language</label>
        <div className="flex rounded-lg border border-border overflow-hidden">
          {["es", "en"].map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-3 py-2 text-xs font-mono uppercase transition-colors ${
                lang === l ? "bg-teal/20 text-teal" : "bg-panel2 text-textdim hover:text-text"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
