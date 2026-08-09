import { useState, useMemo } from "react";
import { Link } from "react-router";
import { useEquipos } from "@/hooks/useEquipos";
import { listCategorias } from "@/api/categorias";
import { useEffect } from "react";
import { StatusBadge } from "@/components/StatusBadge";
import type { CategoriaDTO } from "@/api/types";
import { t } from "@/i18n/es";

export default function Dashboard() {
  const { equipos, loading, error, refetch } = useEquipos();
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    listCategorias().then(setCategorias).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    return equipos.filter((e) => {
      const matchCat = categoriaId === null || e.categoria.id === categoriaId;
      const matchSearch =
        search.trim() === "" ||
        e.nombre.toLowerCase().includes(search.toLowerCase()) ||
        e.identificador.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [equipos, categoriaId, search]);

  const counts = useMemo(() => ({
    disponibles: equipos.filter((e) => e.statusUI === "disponible").length,
    reservados: equipos.filter((e) => e.statusUI === "reservado").length,
    mantenimiento: equipos.filter((e) => e.statusUI === "mantenimiento").length,
    baja: equipos.filter((e) => e.statusUI === "baja").length,
  }), [equipos]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#0E2A36]" style={{ fontFamily: "Poppins, sans-serif" }}>
          {t.dashboard.title}
        </h1>
        <p className="mt-1 text-[#6B8A94] text-sm sm:text-base">{t.dashboard.subtitle}</p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { label: t.dashboard.stats.disponibles, value: counts.disponibles, color: "border-green-500 bg-green-50", text: "text-green-700" },
          { label: t.dashboard.stats.reservados, value: counts.reservados, color: "border-amber-400 bg-amber-50", text: "text-amber-700" },
          { label: t.dashboard.stats.mantenimiento, value: counts.mantenimiento, color: "border-gray-400 bg-gray-50", text: "text-gray-600" },
          { label: t.dashboard.stats.baja, value: counts.baja, color: "border-gray-800 bg-gray-100", text: "text-gray-800" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl border-l-4 p-4 ${s.color}`}>
            <div className={`text-2xl font-bold ${s.text}`} style={{ fontFamily: "Poppins, sans-serif" }}>{s.value}</div>
            <div className={`text-xs font-medium mt-0.5 ${s.text}`}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B8A94]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8"/><path strokeLinecap="round" d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder={t.dashboard.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-[#DDE5E8] bg-white text-[#0E2A36] placeholder-[#6B8A94] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoriaId(null)}
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${categoriaId === null ? "bg-[#1B7A80] text-white border-[#1B7A80]" : "bg-white text-[#0E2A36] border-[#DDE5E8] hover:border-[#1B7A80] hover:text-[#1B7A80]"}`}
          >
            {t.dashboard.filterAll}
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaId(c.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${categoriaId === c.id ? "bg-[#1B7A80] text-white border-[#1B7A80]" : "bg-white text-[#0E2A36] border-[#DDE5E8] hover:border-[#1B7A80] hover:text-[#1B7A80]"}`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 font-medium flex items-center gap-2">
          ⚠️ {error}
          <button onClick={refetch} className="ml-auto text-xs underline">Reintentar</button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#DDE5E8] h-48 animate-pulse" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!loading && filtered.length === 0 && !error && (
        <div className="text-center py-20 text-[#6B8A94]">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">{t.dashboard.noResults}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((equipo) => (
            <div
              key={equipo.id}
              className="bg-white rounded-2xl border border-[#DDE5E8] hover:border-[#6FBFBA] hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
            >
              {/* Status colour band */}
              <div
                className="h-1.5 w-full flex-shrink-0"
                style={{
                  background:
                    equipo.statusUI === "disponible" ? "#16A34A"
                    : equipo.statusUI === "reservado" ? "#F5A623"
                    : equipo.statusUI === "mantenimiento" ? "#9CA3AF"
                    : "#1F2937",
                }}
              />

              <div className="p-4 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-semibold text-[#6B8A94] bg-[#F4F7F8] px-2 py-0.5 rounded">
                    {equipo.identificador}
                  </span>
                  <StatusBadge status={equipo.statusUI} />
                </div>

                <h3
                  className="font-semibold text-[#0E2A36] text-sm leading-snug mb-1 group-hover:text-[#1B7A80] transition-colors"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {equipo.nombre}
                </h3>

                {/* Category description as contextual hint */}
                <p className="text-xs text-[#6B8A94] leading-relaxed flex-1 italic">
                  {equipo.categoria.nombre}
                </p>

                <div className="mt-3 pt-3 border-t border-[#F4F7F8]">
                  <div className="flex items-center gap-1.5 text-xs text-[#6B8A94]">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a0 0 0 010 0z"/>
                    </svg>
                    {equipo.categoria.nombre}
                  </div>
                </div>

                <Link
                  to={`/equipos/${equipo.id}`}
                  className="mt-3 w-full text-center text-sm font-semibold py-2 rounded-xl bg-[#F4F7F8] text-[#1B7A80] hover:bg-[#1B7A80] hover:text-white transition-colors"
                >
                  {t.dashboard.reservar}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Static location notice */}
      <div className="mt-10 flex items-center gap-3 bg-[#6FBFBA]/10 border border-[#6FBFBA]/30 rounded-xl px-4 py-3 text-sm text-[#1B7A80]">
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        <span>Todos los equipos se encuentran en el <strong>Laboratorio LIS — Bloque 18, Salón 210</strong>.</span>
      </div>
    </div>
  );
}
