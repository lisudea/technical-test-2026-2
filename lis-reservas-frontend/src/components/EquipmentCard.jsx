import { CheckCircle2, Clock, Wrench, Cpu } from "lucide-react";

const ESTILOS_ESTADO = {
  disponible: {
    texto: "Disponible",
    icono: CheckCircle2,
    badge: "bg-green-50 text-green-700 border-green-200",
    punto: "bg-green-500",
  },
  reservado: {
    texto: "Reservado",
    icono: Clock,
    badge: "bg-red-50 text-red-700 border-red-200",
    punto: "bg-red-500",
  },
  mantenimiento: {
    texto: "Mantenimiento",
    icono: Wrench,
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    punto: "bg-slate-400",
  },
};

function formatearFecha(fechaISO) {
  const fecha = new Date(fechaISO);
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function EquipmentCard({ equipo, onReservar }) {
  const config = ESTILOS_ESTADO[equipo.estado] || ESTILOS_ESTADO.disponible;
  const Icono = config.icono;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Cpu size={18} className="text-blue-600" />
        </div>
        <span
          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${config.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${config.punto}`} />
          {config.texto}
        </span>
      </div>

      <div>
        <h3 className="font-semibold text-slate-800 leading-snug">{equipo.nombre}</h3>
        <p className="text-sm text-slate-400 mt-0.5">Serie: {equipo.numeroSerie}</p>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500 border-t border-slate-100 pt-3">
        <span>{equipo.categoria}</span>
        <span>{formatearFecha(equipo.creadoEn)}</span>
      </div>

      <button
        onClick={() => onReservar(equipo)}
        disabled={equipo.estado !== "disponible"}
        className={`w-full text-sm font-medium py-2 rounded-xl transition-colors
          ${equipo.estado === "disponible"
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-slate-100 text-slate-400 cursor-not-allowed"}`}
      >
        Reservar equipo
      </button>
    </div>
  );
}

export default EquipmentCard;