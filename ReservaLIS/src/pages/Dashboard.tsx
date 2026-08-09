import { useState, useMemo } from "react";
import { Link } from "react-router";
import { equipos, categorias, type EquipoStatus } from "@/data/mock";
import { StatusBadge } from "@/components/StatusBadge";
import { t } from "@/i18n/es";

const statusIcons: Record<EquipoStatus, string> = {
  disponible: "🟢",
  reservado: "🔴",
  mantenimiento: "⚫",
  baja: "◼️",
};

export default function Dashboard() {
  const [categoriaId, setCategoriaId] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return equipos.filter((e) => {
      const matchCat = categoriaId === null || e.categoriaId === categoriaId;
      const matchSearch =
        search.trim() === "" ||
        e.nombre.toLowerCase().includes(search.toLowerCase()) ||
        e.codigo.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [categoriaId, search]);

  const counts = useMemo(() => ({
    disponibles: equipos.filter((e) => e.status === "disponible").length,
    reservados: equipos.filter((e) => e.status === "reservado").length,
    mantenimiento: equipos.filter((e) => e.status === "mantenimiento").length,
    baja: equipos.filter((e) => e.status === "baja").length,
  }), []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
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
          { label: t.dashboard.stats.reservados, value: counts.reservados, color: "border-red-500 bg-red-50", text: "text-red-700" },
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
            className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
              categoriaId === null
                ? "bg-[#1B7A80] text-white border-[#1B7A80]"
                : "bg-white text-[#0E2A36] border-[#DDE5E8] hover:border-[#1B7A80] hover:text-[#1B7A80]"
            }`}
          >
            {t.dashboard.filterAll}
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategoriaId(c.id)}
              className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
                categoriaId === c.id
                  ? "bg-[#1B7A80] text-white border-[#1B7A80]"
                  : "bg-white text-[#0E2A36] border-[#DDE5E8] hover:border-[#1B7A80] hover:text-[#1B7A80]"
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-[#6B8A94]">
          <div className="text-4xl mb-3">🔍</div>
          <p className="font-medium">{t.dashboard.noResults}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((equipo) => {
            const cat = categorias.find((c) => c.id === equipo.categoriaId);
            return (
              <div
                key={equipo.id}
                className="bg-white rounded-2xl border border-[#DDE5E8] hover:border-[#6FBFBA] hover:shadow-md transition-all duration-200 flex flex-col overflow-hidden group"
              >
                {/* Color band */}
                <div
                  className="h-1.5 w-full"
                  style={{
                    background:
                      equipo.status === "disponible"
                        ? "#16A34A"
                        : equipo.status === "reservado"
                        ? "#DC2626"
                        : equipo.status === "mantenimiento"
                        ? "#9CA3AF"
                        : "#1F2937",
                  }}
                />

                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono font-semibold text-[#6B8A94] bg-[#F4F7F8] px-2 py-0.5 rounded">
                      {equipo.codigo}
                    </span>
                    <StatusBadge status={equipo.status} />
                  </div>

                  <h3
                    className="font-semibold text-[#0E2A36] text-sm leading-snug mb-1 group-hover:text-[#1B7A80] transition-colors"
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {equipo.nombre}
                  </h3>

                  <p className="text-xs text-[#6B8A94] leading-relaxed flex-1 line-clamp-3">
                    {equipo.descripcion}
                  </p>

                  <div className="mt-3 pt-3 border-t border-[#F4F7F8] space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-[#6B8A94]">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a0 0 0 010 0z"/>
                      </svg>
                      {cat?.nombre}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#6B8A94]">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <span className="truncate">{equipo.ubicacion}</span>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
