import { useState, useCallback } from "react";
import { getTopEquipos } from "@/api/estadisticas";
import { ApiError, dateToIsoDateTime } from "@/api/client";
import type { TopEquipoDTO } from "@/api/types";
import { t } from "@/i18n/es";

const COLORS = [
  "#1B7A80", "#6FBFBA", "#F5A623", "#0E2A36", "#6B8A94",
];

export default function Estadisticas() {
  const [desde, setDesde] = useState("2026-08-01");
  const [hasta, setHasta] = useState("2026-08-31");
  const [data, setData] = useState<TopEquipoDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getTopEquipos({
        desde: dateToIsoDateTime(desde, false),
        hasta: dateToIsoDateTime(hasta, true),
      });
      setData(result);
      setHasLoaded(true);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setError("Rango de fechas inválido: la fecha de inicio no puede ser posterior a la de fin.");
      } else {
        setError("No se pudieron cargar las estadísticas. Verifica tu conexión.");
      }
    } finally {
      setLoading(false);
    }
  }, [desde, hasta]);

  const maxReservas = data.length > 0 ? Math.max(...data.map((d) => d.totalReservas)) : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0E2A36]" style={{ fontFamily: "Poppins, sans-serif" }}>
          {t.estadisticas.title}
        </h1>
        <p className="mt-1 text-[#6B8A94] text-sm">{t.estadisticas.subtitle}</p>
      </div>

      {/* Date filter */}
      <div className="bg-white rounded-2xl border border-[#DDE5E8] p-5 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.estadisticas.filtroDesde}</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{t.estadisticas.filtroHasta}</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="text-sm px-3 py-2 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
            />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-[#1B7A80] text-white text-sm font-semibold hover:bg-[#0E2A36] transition-colors disabled:opacity-60"
          >
            {loading ? "Cargando…" : t.estadisticas.aplicar}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* Empty state */}
      {!hasLoaded && !loading && (
        <div className="text-center py-20 text-[#6B8A94]">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-medium">Selecciona un rango de fechas y pulsa "{t.estadisticas.aplicar}".</p>
        </div>
      )}

      {hasLoaded && data.length === 0 && !loading && (
        <div className="text-center py-20 text-[#6B8A94]">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">{t.estadisticas.noData}</p>
        </div>
      )}

      {data.length > 0 && (
        <>
          {/* Bar chart */}
          <div className="bg-white rounded-2xl border border-[#DDE5E8] p-6 mb-6">
            <h2 className="text-sm font-semibold text-[#0E2A36] mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Top {data.length} equipos más reservados · {desde} → {hasta}
            </h2>
            <div className="space-y-4">
              {data.map((item, idx) => {
                const pct = (item.totalReservas / maxReservas) * 100;
                const color = COLORS[idx % COLORS.length];
                return (
                  <div key={item.equipoId} className="flex items-center gap-3">
                    <span className="text-lg font-bold w-6 text-center flex-shrink-0" style={{ fontFamily: "Poppins, sans-serif", color }}>
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1 gap-2">
                        <span className="text-sm font-medium text-[#0E2A36] truncate">{item.nombre}</span>
                        <span className="text-sm font-bold flex-shrink-0" style={{ color }}>{item.totalReservas}</span>
                      </div>
                      <div className="h-2.5 bg-[#F4F7F8] rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-[#DDE5E8] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#F4F7F8] border-b border-[#DDE5E8]">
                  {[t.estadisticas.columnas.puesto, t.estadisticas.columnas.equipo, t.estadisticas.columnas.total].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-[#6B8A94] uppercase tracking-wide">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, idx) => {
                  const color = COLORS[idx % COLORS.length];
                  return (
                    <tr key={item.equipoId} className={`border-b border-[#F4F7F8] ${idx % 2 === 1 ? "bg-[#FAFCFD]" : ""}`}>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full text-white text-xs font-bold" style={{ background: color }}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#0E2A36]">{item.nombre}</td>
                      <td className="px-4 py-3 font-bold text-[#0E2A36]">{item.totalReservas}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
