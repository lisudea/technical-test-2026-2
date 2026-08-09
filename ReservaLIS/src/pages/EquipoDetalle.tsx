import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { getEquipo } from "@/api/equipos";
import { listReservas, createReserva } from "@/api/reservas";
import { ApiError, toIsoDateTime } from "@/api/client";
import { StatusBadge } from "@/components/StatusBadge";
import type { EquipoResponseDTO, EquipoStatus } from "@/api/types";
import { t } from "@/i18n/es";

type FormState = {
  nombre: string;
  correo: string;
  fechaInicio: string;
  fechaFin: string;
};

type SubmitState = "idle" | "loading" | "success" | "error";

function deriveStatusUI(
  equipo: EquipoResponseDTO,
  activeReservas: { equipoId: number; inicio: Date; fin: Date }[],
  now: Date,
): EquipoStatus {
  if (equipo.estadoFisico === "MANTENIMIENTO") return "mantenimiento";
  if (equipo.estadoFisico === "DE_BAJA") return "baja";
  const currentlyReserved = activeReservas.some(
    (r) => r.equipoId === equipo.id && r.inicio <= now && r.fin >= now,
  );
  return currentlyReserved ? "reservado" : "disponible";
}

export default function EquipoDetalle() {
  const { id } = useParams();
  const [equipo, setEquipo] = useState<EquipoResponseDTO | null>(null);
  const [statusUI, setStatusUI] = useState<EquipoStatus>("disponible");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({ nombre: "", correo: "", fechaInicio: "", fechaFin: "" });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoadError(null);
    Promise.all([
      getEquipo(Number(id)),
      listReservas({ estadoReserva: "ACTIVA", equipoId: Number(id), size: 100 }),
    ])
      .then(([eq, reservasPage]) => {
        const now = new Date();
        const slots = reservasPage.content.map((r) => ({
          equipoId: r.equipo.id,
          inicio: new Date(r.fechaHoraInicio),
          fin: new Date(r.fechaHoraFin),
        }));
        setEquipo(eq);
        setStatusUI(deriveStatusUI(eq, slots, now));
      })
      .catch(() => setLoadError("No se pudo cargar el equipo."));
  }, [id]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!equipo) return;
    setSubmitState("loading");
    setSubmitError(null);
    try {
      await createReserva({
        equipoId: equipo.id,
        usuarioNombre: form.nombre,
        usuarioCorreo: form.correo,
        fechaHoraInicio: toIsoDateTime(form.fechaInicio),
        fechaHoraFin: toIsoDateTime(form.fechaFin),
      });
      setSubmitState("success");
      setForm({ nombre: "", correo: "", fechaInicio: "", fechaFin: "" });
    } catch (err) {
      setSubmitState("error");
      if (err instanceof ApiError) {
        if (err.status === 409) {
          setSubmitError(t.equipo.form.errorConflict);
        } else if (err.status === 400) {
          setSubmitError(err.message || t.equipo.form.errorGeneric);
        } else if (err.status === 404) {
          setSubmitError("El equipo ya no existe en el sistema.");
        } else {
          setSubmitError(t.equipo.form.errorGeneric);
        }
      } else {
        setSubmitError(t.equipo.form.errorGeneric);
      }
    }
  }

  if (loadError) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-[#6B8A94] font-medium">{loadError}</p>
        <Link to="/" className="mt-4 inline-block text-[#1B7A80] font-semibold hover:underline">{t.equipo.backToDashboard}</Link>
      </div>
    );
  }

  if (!equipo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-4xl mb-3 animate-pulse">⏳</div>
        <p className="text-[#6B8A94]">Cargando equipo…</p>
      </div>
    );
  }

  const canReserve = equipo.estadoFisico === "DISPONIBLE";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-[#1B7A80] font-medium hover:underline mb-6">
        {t.equipo.backToDashboard}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — equipo info */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#DDE5E8] p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="text-xs font-mono font-semibold text-[#6B8A94] bg-[#F4F7F8] px-2.5 py-1 rounded-lg">
              {equipo.identificador}
            </span>
            <StatusBadge status={statusUI} />
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-[#0E2A36] mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
            {equipo.nombre}
          </h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: t.equipo.codigo, value: equipo.identificador, icon: "🏷️" },
              { label: t.equipo.categoria, value: equipo.categoria.nombre, icon: "📂" },
            ].map((item) => (
              <div key={item.label} className="bg-[#F4F7F8] rounded-xl p-3">
                <div className="text-base mb-1">{item.icon}</div>
                <div className="text-[10px] font-semibold text-[#6B8A94] uppercase tracking-wide">{item.label}</div>
                <div className="text-sm font-medium text-[#0E2A36] mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Status notice */}
          {statusUI !== "disponible" && (
            <div
              className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium border ${
                statusUI === "reservado"
                  ? "bg-amber-50 border-amber-200 text-amber-800"
                  : statusUI === "mantenimiento"
                  ? "bg-gray-100 border-gray-300 text-gray-700"
                  : "bg-gray-900 border-gray-700 text-gray-200"
              }`}
            >
              {statusUI === "reservado" && "⚠️ Este equipo tiene una reserva activa en el horario actual."}
              {statusUI === "mantenimiento" && "🔧 Este equipo está fuera de servicio temporalmente por mantenimiento."}
              {statusUI === "baja" && "🚫 Este equipo fue dado de baja y no está disponible."}
            </div>
          )}
        </div>

        {/* Right — reservation form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DDE5E8] p-6 self-start">
          <h2 className="text-base font-semibold text-[#0E2A36] mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            {t.equipo.reservarTitle}
          </h2>

          {submitState === "success" ? (
            <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-center">
              <div className="text-3xl mb-2">✅</div>
              <p className="font-semibold text-green-700 text-sm">{t.equipo.form.successTitle}</p>
              <p className="text-green-600 text-xs mt-1">{t.equipo.form.successMsg}</p>
              <button
                onClick={() => setSubmitState("idle")}
                className="mt-4 text-xs font-semibold text-[#1B7A80] hover:underline"
              >
                Hacer otra reserva
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {submitState === "error" && submitError && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                  ⚠️ {submitError}
                </div>
              )}

              {[
                { name: "nombre", label: t.equipo.form.nombre, type: "text" },
                { name: "correo", label: t.equipo.form.correo, type: "email" },
                { name: "fechaInicio", label: t.equipo.form.fechaInicio, type: "datetime-local" },
                { name: "fechaFin", label: t.equipo.form.fechaFin, type: "datetime-local" },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name as keyof FormState]}
                    onChange={handleChange}
                    required
                    disabled={!canReserve || submitState === "loading"}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={!canReserve || submitState === "loading"}
                className="w-full py-2.5 rounded-xl text-sm font-semibold bg-[#1B7A80] text-white hover:bg-[#0E2A36] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitState === "loading" ? t.equipo.form.submitting : t.equipo.form.submit}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
