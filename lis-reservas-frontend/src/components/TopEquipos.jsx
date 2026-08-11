// src/components/TopEquipos.jsx
import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { obtenerTopEquipos } from "../services/api";

const MEDALLAS = ["🥇", "🥈", "🥉", "🎖️", "🎖️"];

function TopEquipos() {
  const [top, setTop] = useState([]);
  const [estado, setEstado] = useState("cargando"); // cargando | error | listo

  useEffect(() => {
    cargarTop();
  }, []);

  async function cargarTop() {
    setEstado("cargando");
    try {
      const respuesta = await obtenerTopEquipos();
      setTop(respuesta.data);
      setEstado("listo");
    } catch (error) {
      console.error(error);
      setEstado("error");
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Trophy size={18} className="text-amber-500" />
        <h2 className="font-semibold text-slate-800">Equipos más reservados</h2>
      </div>

      {estado === "cargando" && (
        <p className="text-sm text-slate-400">Cargando estadísticas...</p>
      )}

      {estado === "error" && (
        <p className="text-sm text-slate-400">No pudimos cargar las estadísticas.</p>
      )}

      {estado === "listo" && top.length === 0 && (
        <p className="text-sm text-slate-400">Todavía no hay reservas registradas.</p>
      )}

      {estado === "listo" && top.length > 0 && (
        <ul className="space-y-2.5">
          {top.map((item, index) => (
            <li key={item.equipo.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-slate-700">
                <span>{MEDALLAS[index] || "•"}</span>
                {item.equipo.nombre}
              </span>
              <span className="text-slate-400">{item.totalReservas} reservas</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TopEquipos;