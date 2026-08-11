import { Search } from "lucide-react";

const ESTADOS = ["Todos", "disponible", "reservado", "mantenimiento"];

function Filters({
  busqueda, onBusquedaChange,
  categoria, onCategoriaChange,
  estado, onEstadoChange,
  categoriasDisponibles, 
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar equipo..."
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
        />
      </div>

      <select
        value={categoria}
        onChange={(e) => onCategoriaChange(e.target.value)}
        className="px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
      >
        <option value="">Todas las categorías</option>
        {categoriasDisponibles.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <select
        value={estado}
        onChange={(e) => onEstadoChange(e.target.value)}
        className="px-3 py-2 text-sm rounded-xl border border-slate-200 text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
      >
        {ESTADOS.map((e) => (
          <option key={e} value={e === "Todos" ? "" : e}>
            {e === "Todos" ? "Todos los estados" : e.charAt(0).toUpperCase() + e.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Filters;