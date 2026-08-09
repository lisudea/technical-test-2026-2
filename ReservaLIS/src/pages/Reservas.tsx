import { useState } from "react";
import { reservas as initialReservas } from "@/data/mock";
import { t } from "@/i18n/es";

function formatDate(dt: string) {
  return new Date(dt).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type CancelState = {
  id: number;
  correoIngresado: string;
  error: string | null;
};

export default function Reservas() {
  const [items, setItems] = useState(initialReservas);
  const [cancelState, setCancelState] = useState<CancelState | null>(null);

  function startCancel(id: number) {
    setCancelState({ id, correoIngresado: "", error: null });
  }

  function handleCancelInput(e: React.ChangeEvent<HTMLInputElement>) {
    setCancelState((prev) => prev ? { ...prev, correoIngresado: e.target.value, error: null } : null);
  }

  function confirmCancel() {
    if (!cancelState) return;
    const reserva = items.find((r) => r.id === cancelState.id);
    if (!reserva) return;

    // Basic format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cancelState.correoIngresado)) {
      setCancelState((prev) => prev ? { ...prev, error: "Ingresa un correo electrónico válido." } : null);
      return;
    }

    // Placeholder for backend validation — currently only checks format
    // TODO: backend will verify cancelState.correoIngresado === reserva.correo
    setItems((prev) =>
      prev.map((r) => (r.id === cancelState.id ? { ...r, estado: "cancelada" } : r))
    );
    setCancelState(null);
  }

  const activeCancel = cancelState ? items.find((r) => r.id === cancelState.id) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1
          className="text-2xl sm:text-3xl font-bold text-[#0E2A36]"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          {t.reservas.title}
        </h1>
        <p className="mt-1 text-[#6B8A94] text-sm sm:text-base">{t.reservas.subtitle}</p>
      </div>

      {/* Cancel confirmation modal */}
      {cancelState && activeCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[#DDE5E8] shadow-xl w-full max-w-sm p-6">
            <h3
              className="font-semibold text-[#0E2A36] mb-1"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Cancelar reserva
            </h3>
            <p className="text-sm text-[#6B8A94] mb-1">
              Equipo: <span className="font-medium text-[#0E2A36]">{activeCancel.equipoNombre}</span>
            </p>
            <p className="text-sm text-[#6B8A94] mb-4">
              Solicitante: <span className="font-medium text-[#0E2A36]">{activeCancel.solicitante}</span>
            </p>

            <p className="text-xs text-[#6B8A94] mb-3 leading-relaxed">
              Para confirmar la cancelación, ingresa el correo electrónico con el que se realizó esta reserva.
            </p>

            <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">
              Correo de confirmación
            </label>
            <input
              type="email"
              value={cancelState.correoIngresado}
              onChange={handleCancelInput}
              placeholder="tu@correo.edu.co"
              className={`w-full text-sm px-3 py-2.5 rounded-xl border bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition ${
                cancelState.error ? "border-red-400" : "border-[#DDE5E8]"
              }`}
            />
            {cancelState.error && (
              <p className="text-xs text-red-600 mt-1.5">{cancelState.error}</p>
            )}

            <div className="flex gap-2 mt-5">
              <button
                onClick={confirmCancel}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Cancelar reserva
              </button>
              <button
                onClick={() => setCancelState(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#F4F7F8] text-[#6B8A94] hover:bg-[#DDE5E8] transition-colors"
              >
                {t.admin.cancelar}
              </button>
            </div>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-20 text-[#6B8A94]">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium">{t.reservas.noReservas}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-[#DDE5E8] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDE5E8] bg-[#F4F7F8]">
                  {[
                    t.reservas.columnas.equipo,
                    t.reservas.columnas.solicitante,
                    t.reservas.columnas.inicio,
                    t.reservas.columnas.fin,
                    t.reservas.columnas.estado,
                    t.reservas.columnas.acciones,
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold text-[#6B8A94] uppercase tracking-wide"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-[#F4F7F8] ${r.estado === "cancelada" ? "opacity-50" : ""} ${i % 2 === 1 ? "bg-[#FAFCFD]" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium text-[#0E2A36]">{r.equipoNombre}</td>
                    <td className="px-4 py-3 text-[#0E2A36]">{r.solicitante}</td>
                    <td className="px-4 py-3 text-[#6B8A94] text-xs font-mono">{formatDate(r.fechaInicio)}</td>
                    <td className="px-4 py-3 text-[#6B8A94] text-xs font-mono">{formatDate(r.fechaFin)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          r.estado === "activa"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {r.estado === "activa" ? t.reservas.estados.activa : t.reservas.estados.cancelada}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.estado === "activa" && (
                        <button
                          onClick={() => startCancel(r.id)}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline"
                        >
                          {t.reservas.cancelar}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {items.map((r) => (
              <div
                key={r.id}
                className={`bg-white rounded-2xl border border-[#DDE5E8] p-4 ${r.estado === "cancelada" ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-[#0E2A36] text-sm">{r.equipoNombre}</span>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      r.estado === "activa" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {r.estado === "activa" ? t.reservas.estados.activa : t.reservas.estados.cancelada}
                  </span>
                </div>
                <p className="text-xs text-[#0E2A36]">{r.solicitante}</p>
                <div className="mt-2 text-xs text-[#6B8A94] font-mono">
                  {formatDate(r.fechaInicio)} → {formatDate(r.fechaFin)}
                </div>
                {r.estado === "activa" && (
                  <button
                    onClick={() => startCancel(r.id)}
                    className="mt-3 text-xs font-semibold text-red-600 hover:underline"
                  >
                    {t.reservas.cancelar}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
