import { useState } from "react";
import { useI18n } from "../i18n/I18nContext";
import { api } from "../api";

export default function ReservationModal({ equipo, onClose, onSuccess, onError }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ usuario_nombre: "", usuario_correo: "", inicio: "", fin: "" });
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState(null);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!form.usuario_nombre || !form.usuario_correo || !form.inicio || !form.fin) {
      setLocalError(t("fieldsRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await api.crearReserva({
        equipo_id: equipo.id,
        usuario_nombre: form.usuario_nombre,
        usuario_correo: form.usuario_correo,
        fecha_hora_inicio: new Date(form.inicio).toISOString(),
        fecha_hora_fin: new Date(form.fin).toISOString(),
      });
      onSuccess();
    } catch (err) {
      if (err.status === 409) {
        setLocalError(t("reservationConflict"));
      } else {
        setLocalError(err.message || t("genericError"));
      }
      onError?.(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-panel border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-mono text-sm font-semibold text-teal">{t("modalTitle")}</h2>
          <button onClick={onClose} className="text-textdim hover:text-text text-lg leading-none">×</button>
        </div>
        <p className="text-xs text-textdim font-mono mb-4">{equipo.nombre}</p>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="text" placeholder={t("yourName")} value={form.usuario_nombre} onChange={update("usuario_nombre")}
            className="bg-panel2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-textdim/60 focus:outline-none focus:ring-1 focus:ring-teal"
          />
          <input
            type="email" placeholder={t("yourEmail")} value={form.usuario_correo} onChange={update("usuario_correo")}
            className="bg-panel2 border border-border rounded-lg px-3 py-2 text-sm text-text placeholder:text-textdim/60 focus:outline-none focus:ring-1 focus:ring-teal"
          />
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase text-textdim">{t("startDate")}</label>
              <input type="datetime-local" value={form.inicio} onChange={update("inicio")}
                className="bg-panel2 border border-border rounded-lg px-2 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-teal" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-mono uppercase text-textdim">{t("endDate")}</label>
              <input type="datetime-local" value={form.fin} onChange={update("fin")}
                className="bg-panel2 border border-border rounded-lg px-2 py-2 text-xs text-text focus:outline-none focus:ring-1 focus:ring-teal" />
            </div>
          </div>

          {localError && (
            <div className="text-xs font-mono text-rose bg-rose/10 border border-rose/30 rounded-lg px-3 py-2">
              {localError}
            </div>
          )}

          <div className="flex gap-2 mt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg text-xs font-mono text-textdim border border-border hover:text-text">
              {t("cancel")}
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2 rounded-lg text-xs font-mono font-semibold text-teal bg-teal/10 border border-teal/40 hover:bg-teal/20 disabled:opacity-50">
              {t("confirmReservation")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
