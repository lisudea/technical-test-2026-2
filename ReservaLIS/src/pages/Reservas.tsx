import { useState } from "react";
import { useReservas } from "@/hooks/useReservas";
import { useGoogleAuth } from "@/context/GoogleAuthContext";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { useTranslation } from "@/context/LanguageContext";

function formatDate(dt: string) {
  return new Date(dt).toLocaleString("es-CO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

type CancelState = {
  id: number;
  error: string | null;
  errorKind: "auth" | "forbidden" | "other" | null;
  submitting: boolean;
};

export default function Reservas() {
  const { t } = useTranslation();
  const { items, loading, lastFetched, refetch, cancelar } = useReservas(true);
  const { idToken, email, clearAuth } = useGoogleAuth();
  const [cancelState, setCancelState] = useState<CancelState | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  function startCancel(id: number) {
    setCancelState({ id, error: null, errorKind: null, submitting: false });
    setGoogleError(null);
  }

  function closeCancel() {
    setCancelState(null);
    setGoogleError(null);
  }

  async function confirmCancel() {
    if (!cancelState || !idToken) return;
    setCancelState((prev) => prev ? { ...prev, submitting: true, error: null, errorKind: null } : null);
    const result = await cancelar(cancelState.id, idToken);
    if (result) {
      if (result.kind === "auth") {
        clearAuth();
      }
      setCancelState((prev) => prev ? { ...prev, submitting: false, error: result.error, errorKind: result.kind } : null);
    } else {
      setCancelState(null);
    }
  }

  const activeCancel = cancelState ? items.find((r) => r.id === cancelState.id) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0E2A36]" style={{ fontFamily: "Poppins, sans-serif" }}>
            {t.reservas.title}
          </h1>
          <p className="mt-1 text-[#6B8A94] text-sm">{t.reservas.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={refetch}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-medium text-[#1B7A80] hover:text-[#0E2A36] disabled:opacity-50 transition-colors"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Actualizar
          </button>
          {lastFetched && (
            <span className="text-[10px] text-[#6B8A94]">
              {lastFetched.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* Cancel modal */}
      {cancelState && activeCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-[#DDE5E8] shadow-xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-[#0E2A36] mb-1" style={{ fontFamily: "Poppins, sans-serif" }}>
              Cancelar reserva
            </h3>
            <p className="text-sm text-[#6B8A94] mb-1">
              Equipo: <span className="font-medium text-[#0E2A36]">{activeCancel.equipo.nombre}</span>
            </p>
            <p className="text-sm text-[#6B8A94] mb-4">
              Solicitante: <span className="font-medium text-[#0E2A36]">{activeCancel.usuarioNombre}</span>
            </p>

            {/* Error messages */}
            {cancelState.error && (
              <div className={`mb-4 rounded-xl px-3 py-2.5 text-xs font-medium border ${
                cancelState.errorKind === "forbidden"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : "bg-red-50 border-red-200 text-red-700"
              }`}>
                {cancelState.errorKind === "forbidden" ? "🚫" : "⚠️"} {cancelState.error}
              </div>
            )}

            {/* Google auth section */}
            <div className="mb-4">
              {idToken && email ? (
                <div className="flex items-center justify-between gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-green-500 text-sm flex-shrink-0">✓</span>
                    <span className="text-xs font-medium text-green-800 truncate">{email}</span>
                  </div>
                  {cancelState.errorKind !== "forbidden" && (
                    <button
                      type="button"
                      onClick={() => { clearAuth(); setCancelState((p) => p ? { ...p, error: null, errorKind: null } : null); }}
                      className="text-[10px] font-semibold text-[#6B8A94] hover:text-[#0E2A36] flex-shrink-0 transition-colors"
                    >
                      Cambiar
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-xs text-[#6B8A94] mb-2 leading-relaxed">
                    Para confirmar la cancelación, inicia sesión con tu cuenta institucional.
                  </p>
                  <GoogleSignInButton
                    onError={(msg) => setGoogleError(msg)}
                    onSuccess={() => setGoogleError(null)}
                  />
                  {googleError && (
                    <p className="text-xs text-red-600 mt-1.5">{googleError}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {/* Only show confirm button when signed in and error is not "forbidden" */}
              {idToken && cancelState.errorKind !== "forbidden" && (
                <button
                  onClick={confirmCancel}
                  disabled={cancelState.submitting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
                >
                  {cancelState.submitting ? "Cancelando…" : "Cancelar reserva"}
                </button>
              )}
              <button
                onClick={closeCancel}
                disabled={cancelState.submitting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#F4F7F8] text-[#6B8A94] hover:bg-[#DDE5E8] transition-colors disabled:opacity-60"
              >
                {cancelState.errorKind === "forbidden" ? "Cerrar" : t.admin.cancelar}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* States */}
      {loading && items.length === 0 ? (
        <div className="text-center py-20 text-[#6B8A94]">
          <svg className="w-6 h-6 animate-spin mx-auto mb-3 text-[#6FBFBA]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <p className="text-sm">Cargando reservas…</p>
        </div>
      ) : items.length === 0 ? (
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
                  {[t.reservas.columnas.equipo, t.reservas.columnas.solicitante, t.reservas.columnas.inicio, t.reservas.columnas.fin, t.reservas.columnas.estado, t.reservas.columnas.acciones].map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-[#6B8A94] uppercase tracking-wide">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((r, i) => (
                  <tr key={r.id} className={`border-b border-[#F4F7F8] ${r.estadoReserva === "CANCELADA" ? "opacity-50" : ""} ${i % 2 === 1 ? "bg-[#FAFCFD]" : ""}`}>
                    <td className="px-4 py-3 font-medium text-[#0E2A36]">{r.equipo.nombre}</td>
                    <td className="px-4 py-3 text-[#0E2A36]">{r.usuarioNombre}</td>
                    <td className="px-4 py-3 text-[#6B8A94] text-xs font-mono">{formatDate(r.fechaHoraInicio)}</td>
                    <td className="px-4 py-3 text-[#6B8A94] text-xs font-mono">{formatDate(r.fechaHoraFin)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${r.estadoReserva === "ACTIVA" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {r.estadoReserva === "ACTIVA" ? t.reservas.estados.activa : t.reservas.estados.cancelada}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {r.estadoReserva === "ACTIVA" && (
                        <button onClick={() => startCancel(r.id)} className="text-xs font-semibold text-red-600 hover:text-red-800 hover:underline">
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
              <div key={r.id} className={`bg-white rounded-2xl border border-[#DDE5E8] p-4 ${r.estadoReserva === "CANCELADA" ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-semibold text-[#0E2A36] text-sm">{r.equipo.nombre}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.estadoReserva === "ACTIVA" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {r.estadoReserva === "ACTIVA" ? t.reservas.estados.activa : t.reservas.estados.cancelada}
                  </span>
                </div>
                <p className="text-xs text-[#0E2A36]">{r.usuarioNombre}</p>
                <div className="mt-2 text-xs text-[#6B8A94] font-mono">
                  {formatDate(r.fechaHoraInicio)} → {formatDate(r.fechaHoraFin)}
                </div>
                {r.estadoReserva === "ACTIVA" && (
                  <button onClick={() => startCancel(r.id)} className="mt-3 text-xs font-semibold text-red-600 hover:underline">
                    {t.reservas.cancelar}
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Contact notice */}
      <div className="mt-8 flex items-start gap-3 bg-[#F4F7F8] border border-[#DDE5E8] rounded-xl px-4 py-3 text-sm text-[#6B8A94]">
        <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
        </svg>
        <span>
          ¿Encontraste un problema con una reserva o tienes alguna sugerencia?{" "}
          Escríbenos a{" "}
          <a href="mailto:laboratorio.lis@udea.edu.co" className="font-medium text-[#1B7A80] hover:underline">
            laboratorio.lis@udea.edu.co
          </a>
        </span>
      </div>
    </div>
  );
}
