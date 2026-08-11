// src/components/ReservationModal.jsx
import { useState } from "react";
import { X } from "lucide-react";
import { crearReserva } from "../services/api";

function ReservationModal({ equipo, onClose, onExito, onError }) {
  const [form, setForm] = useState({
    nombreUsuario: "",
    correo: "",
    fechaInicio: "",
    fechaFin: "",
  });
  const [enviando, setEnviando] = useState(false);

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function manejarEnvio(e) {
    e.preventDefault();
    setEnviando(true);

    try {
      await crearReserva({
        nombreUsuario: form.nombreUsuario,
        correo: form.correo,
        equipoId: equipo.id,
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
      });

      onExito(`Reserva creada para "${equipo.nombre}"`);
      onClose();
    } catch (error) {
      const status = error.response?.status;
      const mensajeBackend = error.response?.data?.mensaje;

      if (status === 409) {
        onError("Horario no disponible", mensajeBackend || "El equipo ya está reservado en ese horario. Por favor selecciona otro horario.");
      } else if (status === 401) {
        onError("Sesión requerida", "Debes iniciar sesión con tu cuenta institucional para reservar.");
      } else if (status === 400) {
        onError("Datos inválidos", mensajeBackend || "Revisa la información ingresada.");
      } else if (status === 404) {
        onError("Equipo no encontrado", "El equipo que intentas reservar ya no existe.");
      } else if (!error.response) {
        onError("Error de conexión", "No pudimos comunicarnos con el servidor. Intenta de nuevo.");
      } else {
        onError("Error inesperado", "Ocurrió un problema al crear la reserva. Intenta más tarde.");
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-slate-800">Reservar equipo</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-5">{equipo.nombre}</p>

        <form onSubmit={manejarEnvio} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input
              type="text"
              required
              value={form.nombreUsuario}
              onChange={(e) => actualizarCampo("nombreUsuario", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo</label>
            <input
              type="email"
              required
              value={form.correo}
              onChange={(e) => actualizarCampo("correo", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Inicio</label>
              <input
                type="datetime-local"
                required
                value={form.fechaInicio}
                onChange={(e) => actualizarCampo("fechaInicio", e.target.value)}
                className="w-full px-2 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fin</label>
              <input
                type="datetime-local"
                required
                value={form.fechaFin}
                onChange={(e) => actualizarCampo("fechaFin", e.target.value)}
                className="w-full px-2 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full bg-blue-600 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {enviando ? "Reservando..." : "Confirmar reserva"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ReservationModal;