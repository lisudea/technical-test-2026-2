import { useEffect, useState } from "react";
import { Monitor, CalendarCheck, CheckCircle2, Globe2 } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { obtenerResumen, obtenerTopEquipos, obtenerCategorias } from "../api/estadisticas";
import { listarEquipos } from "../api/equipos";
import { StatCardIcon } from "../components/StatCard";

const RANK_TONES = ["gold", "silver", "bronze", "teal", "teal"];

export default function Estadisticas() {
  const { t } = useLanguage();
  const [resumen, setResumen] = useState(null);
  const [top, setTop] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [codigoPorId, setCodigoPorId] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      obtenerResumen(),
      obtenerTopEquipos(),
      obtenerCategorias(),
      listarEquipos({ size: 500 }),
    ])
      .then(([resumenData, topData, categoriasData, equiposPage]) => {
        if (!active) return;
        setResumen(resumenData);
        setTop(topData);
        setCategorias(categoriasData);
        const map = {};
        (equiposPage.content || []).forEach((eq) => {
          map[eq.id] = eq.codigo;
        });
        setCodigoPorId(map);
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
  }, [t]);

  const maxSolicitudes = top.length > 0 ? Math.max(...top.map((x) => x.cantidadReservas)) : 1;

  return (
    <div className="page">
      <h1 className="page-title">{t("statistics.title")}</h1>

      <div className="section-header-row no-gap">
        <div>
          <h2 className="section-title">{t("statistics.subtitle")}</h2>
          <p className="section-subtitle">{t("statistics.description")}</p>
        </div>
      </div>

      {loading && <div className="state-message">{t("common.loading")}</div>}
      {!loading && error && <div className="state-message state-error">{error}</div>}

      {!loading && !error && resumen && (
        <>
          <div className="stats-row">
            <StatCardIcon icon={Monitor} value={resumen.totalEquipos} label={t("statistics.totalEquipos")} tone="teal" />
            <StatCardIcon icon={CalendarCheck} value={resumen.totalReservas} label={t("statistics.totalReservas")} tone="blue" />
            <StatCardIcon icon={CheckCircle2} value={resumen.reservasActivas} label={t("statistics.reservasActivas")} tone="green" />
            <StatCardIcon icon={Globe2} value={resumen.disponibles} label={t("statistics.disponibles")} tone="emerald" />
          </div>

          <div className="panel">
            <h3 className="panel-title">{t("statistics.topTitle")}</h3>
            <div className="top-list">
              {top.map((item) => {
                const tone = RANK_TONES[item.posicion - 1] || "teal";
                const width = Math.max(6, Math.round((item.cantidadReservas / maxSolicitudes) * 100));
                return (
                  <div key={item.equipoId} className="top-item">
                    <div className={`rank-badge tone-${tone}`}>{item.posicion}</div>
                    <div className="top-item-body">
                      <div className="top-item-row">
                        <span className="top-item-name">{item.nombre}</span>
                        <span className="top-item-count">
                          {item.cantidadReservas} {t("statistics.requests")}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className={`progress-fill tone-${tone}`} style={{ width: `${width}%` }} />
                      </div>
                      <span className="top-item-category">
                        {t(`categories.${item.categoria}`)}
                        {codigoPorId[item.equipoId] ? ` · ${codigoPorId[item.equipoId]}` : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="panel">
            <h3 className="panel-title">{t("statistics.categoryDistribution")}</h3>
            <div className="category-grid">
              {categorias.map((c) => (
                <div key={c.categoria} className="category-card">
                  <div className="category-name">{t(`categories.${c.categoria}`)}</div>
                  <div className="category-total">{c.total}</div>
                  <div className="category-available">
                    {c.disponibles} {t("statistics.available")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
