import { useEffect, useMemo, useState } from "react";
import { Search, Plus } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { CATEGORIAS, ESTADOS_EQUIPO, listarEquipos } from "../api/equipos";
import EquipmentCard from "./EquipmentCard";

const DEBOUNCE_MS = 300;

export default function EquipmentGrid({ onReserve, onEdit, onDelete, onAdd, refreshKey }) {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estado, setEstado] = useState("");
  const [equipos, setEquipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    // Nota: el filtro "estado" solo se aplica en el cliente usando estadoVisual.
    // El backend filtra por el campo administrativo (persistido), que nunca vale
    // RESERVADO -ese valor se calcula a partir de las reservas activas-, así que
    // filtrar "Reservado" en el servidor siempre devolvería una lista vacía.
    listarEquipos({
      search: debouncedSearch || undefined,
      categoria: categoria || undefined,
      size: 200,
    })
      .then((page) => {
        if (active) setEquipos(page.content || []);
      })
      .catch((err) => {
        if (active) setError(err.friendlyMessage || t("common.error"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [debouncedSearch, categoria, refreshKey, t]);

  const visibleEquipos = estado ? equipos.filter((eq) => eq.estadoVisual === estado) : equipos;

  const categoryOptions = useMemo(() => CATEGORIAS, []);
  const statusOptions = useMemo(() => ESTADOS_EQUIPO, []);

  return (
    <div>
      <div className="toolbar">
        <div className="search-input">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder={t("dashboard.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
          <option value="">{t("categories.all")}</option>
          {categoryOptions.map((c) => (
            <option key={c} value={c}>
              {t(`categories.${c}`)}
            </option>
          ))}
        </select>

        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">{t("equipoEstado.all")}</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>
              {t(`equipoEstado.${s}`)}
            </option>
          ))}
        </select>

        <button type="button" className="btn btn-primary" onClick={onAdd}>
          <Plus size={18} />
          {t("dashboard.addEquipment")}
        </button>
      </div>

      {loading && <div className="state-message">{t("common.loading")}</div>}
      {!loading && error && <div className="state-message state-error">{error}</div>}
      {!loading && !error && visibleEquipos.length === 0 && (
        <div className="state-message">{t("common.noResults")}</div>
      )}

      {!loading && !error && visibleEquipos.length > 0 && (
        <div className="equipment-grid">
          {visibleEquipos.map((equipo) => (
            <EquipmentCard
              key={equipo.id}
              equipo={equipo}
              onReserve={onReserve}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
