import { useState } from "react";
import { useParams, Link } from "react-router";
import { equipos, categorias } from "@/data/mock";
import { StatusBadge } from "@/components/StatusBadge";
import { t } from "@/i18n/es";

type FormState = {
  nombre: string;
  correo: string;
  fechaInicio: string;
  fechaFin: string;
};

type SubmitState = "idle" | "loading" | "success" | "conflict" | "error";

export default function EquipoDetalle() {
  const { id } = useParams();
  const equipo = equipos.find((e) => e.id === Number(id));
  const [form, setForm] = useState<FormState>({ nombre: "", correo: "", fechaInicio: "", fechaFin: "" });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  if (!equipo) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">😕</div>
        <p className="text-[#6B8A94] font-medium">Equipo no encontrado.</p>
        <Link to="/" className="mt-4 inline-block text-[#1B7A80] font-semibold hover:underline">{t.equipo.backToDashboard}</Link>
      </div>
    );
  }

  const cat = categorias.find((c) => c.id === equipo.categoriaId);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitState("loading");

    // Simulate API call — random 409 conflict to demonstrate error handling
    setTimeout(() => {
      const mockConflict = false; // set to true to test conflict UI
      if (mockConflict) {
        setSubmitState("conflict");
      } else {
        setSubmitState("success");
        setForm({ nombre: "", correo: "", fechaInicio: "", fechaFin: "" });
      }
    }, 1200);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#1B7A80] font-medium hover:underline mb-6"
      >
        {t.equipo.backToDashboard}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left — equipo info */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-[#DDE5E8] p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <span className="text-xs font-mono font-semibold text-[#6B8A94] bg-[#F4F7F8] px-2.5 py-1 rounded-lg">
              {equipo.codigo}
            </span>
            <StatusBadge status={equipo.status} />
          </div>

          <h1
            className="text-xl sm:text-2xl font-bold text-[#0E2A36] mb-3"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {equipo.nombre}
          </h1>

          <p className="text-sm text-[#6B8A94] leading-relaxed mb-6">{equipo.descripcion}</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: t.equipo.codigo, value: equipo.codigo, icon: "🏷️" },
              { label: t.equipo.categoria, value: cat?.nombre ?? "—", icon: "📂" },
            ].map((item) => (
              <div key={item.label} className="bg-[#F4F7F8] rounded-xl p-3">
                <div className="text-base mb-1">{item.icon}</div>
                <div className="text-[10px] font-semibold text-[#6B8A94] uppercase tracking-wide">{item.label}</div>
                <div className="text-sm font-medium text-[#0E2A36] mt-0.5">{item.value}</div>
              </div>
            ))}
          </div>

          {/* Status notice */}
          {equipo.status !== "disponible" && (
            <div
              className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium border ${
                equipo.status === "reservado"
                  ? "bg-red-50 border-red-200 text-red-700"
                  : equipo.status === "mantenimiento"
                  ? "bg-gray-100 border-gray-300 text-gray-700"
                  : "bg-gray-900 border-gray-700 text-gray-200"
              }`}
            >
              {equipo.status === "reservado" && "⚠️ Este equipo tiene una reserva activa en el horario actual."}
              {equipo.status === "mantenimiento" && "🔧 Este equipo está fuera de servicio temporalmente por mantenimiento."}
              {equipo.status === "baja" && "🚫 Este equipo fue dado de baja y no está disponible."}
            </div>
          )}
        </div>

        {/* Right — reservation form */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#DDE5E8] p-6 self-start">
          <h2
            className="text-base font-semibold text-[#0E2A36] mb-4"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
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
              {/* Conflict error */}
              {submitState === "conflict" && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                  ⚠️ {t.equipo.form.errorConflict}
                </div>
              )}
              {submitState === "error" && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                  ❌ {t.equipo.form.errorGeneric}
                </div>
              )}

              {[
                { name: "nombre", label: t.equipo.form.nombre, type: "text", required: true },
                { name: "correo", label: t.equipo.form.correo, type: "email", required: true },
                { name: "fechaInicio", label: t.equipo.form.fechaInicio, type: "datetime-local", required: true },
                { name: "fechaFin", label: t.equipo.form.fechaFin, type: "datetime-local", required: true },
              ].map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-semibold text-[#0E2A36] mb-1.5">{field.label}</label>
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name as keyof FormState]}
                    onChange={handleChange}
                    required={field.required}
                    disabled={equipo.status === "baja"}
                    className="w-full text-sm px-3 py-2.5 rounded-xl border border-[#DDE5E8] bg-[#F4F7F8] text-[#0E2A36] focus:outline-none focus:ring-2 focus:ring-[#1B7A80]/40 focus:border-[#1B7A80] transition disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              ))}

              <button
                type="submit"
                disabled={submitState === "loading" || equipo.status === "baja"}
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
