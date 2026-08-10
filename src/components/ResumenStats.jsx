import { useEffect, useState } from "react";
import { useLanguage } from "../i18n/LanguageContext";
import { obtenerResumen } from "../api/estadisticas";
import { StatCardBig } from "./StatCard";

export default function ResumenStats({ refreshKey }) {
  const { t } = useLanguage();
  const [resumen, setResumen] = useState(null);

  useEffect(() => {
    let active = true;
    obtenerResumen()
      .then((data) => {
        if (active) setResumen(data);
      })
      .catch(() => {
        if (active) setResumen(null);
      });
    return () => {
      active = false;
    };
  }, [refreshKey]);

  if (!resumen) return null;

  return (
    <div className="stats-row">
      <StatCardBig value={resumen.totalEquipos} label={t("dashboard.totalEquipos")} tone="teal" />
      <StatCardBig value={resumen.disponibles} label={t("dashboard.disponible")} tone="green" />
      <StatCardBig value={resumen.reservados} label={t("dashboard.reservado")} tone="red" />
      <StatCardBig value={resumen.mantenimiento} label={t("dashboard.mantenimiento")} tone="slate" />
    </div>
  );
}
