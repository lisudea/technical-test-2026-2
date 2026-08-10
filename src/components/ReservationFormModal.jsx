import { useEffect, useState } from "react";
import Modal from "./Modal";
import { useLanguage } from "../i18n/LanguageContext";
import { listarEquipos } from "../api/equipos";
import { crearReserva } from "../api/reservas";
import { useToast } from "./ToastContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(
    date.getMinutes()
  )}`;
}

export default function ReservationFormModal({ equipo, onClose, onSaved }) {
  const { t } = useLanguage();
  const toast = useToast();

  const [equipos, setEquipos] = useState(equipo ? [equipo] : []);
  const [loadingEquipos, setLoadingEquipos] = useState(!equipo);
  const now = new Date();
  const defaultStart = toLocalInputValue(new Date(now.getTime() + 30 * 60000));
  const defaultEnd = toLocalInputValue(new Date(now.getTime() + 90 * 60000));

  const [form, setForm] = useState({
    equipoId: equipo?.id ? String(equipo.id) : "",
    nombreUsuario: "",
    correoUsuario: "",
    fechaInicio: defaultStart,
    fechaFin: defaultEnd,
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (equipo) return;
    let active = true;
    // No filtramos por "estado" en el backend: ese campo administrativo nunca
    // vale RESERVADO (se calcula según las reservas activas en el momento).
    // Solo excluimos EN_MANTENIMIENTO, que es la única regla real que aplica
    // el backend al crear una reserva; el resto depende de si hay choque de
    // horario con la fecha elegida, algo que valida el propio servidor.
    listarEquipos({ size: 200 })
      .then((page) => {
        if (active) {
          const disponibles = (page.content || []).filter((eq) => eq.estado !== "EN_MANTENIMIENTO");
          setEquipos(disponibles);
        }
      })
      .finally(() => {
        if (active) setLoadingEquipos(false);
      });
    return () => {
      active = false;
    };
  }, [equipo]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((fe) => ({ ...fe, [field]: undefined }));
  }

  function validate() {
    const errors = {};
    if (!form.equipoId) errors.equipoId = t("common.required");
    if (!form.nombreUsuario.trim()) errors.nombreUsuario = t("common.required");
    if (!form.correoUsuario.trim()) errors.correoUsuario = t("common.required");
    else if (!EMAIL_PATTERN.test(form.correoUsuario.trim())) errors.correoUsuario = t("validation.emailFormat");
    if (!form.fechaInicio) errors.fechaInicio = t("common.required");
    if (!form.fechaFin) errors.fechaFin = t("common.required");
    if (form.fechaInicio && form.fechaFin && !(form.fechaInicio < form.fechaFin)) {
      errors.fechaFin = t("validation.dateOrder");
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const payload = {
      equipoId: Number(form.equipoId),
      nombreUsuario: form.nombreUsuario.trim(),
      correoUsuario: form.correoUsuario.trim(),
      fechaInicio: form.fechaInicio,
      fechaFin: form.fechaFin,
    };

    setSubmitting(true);
    try {
      await crearReserva(payload);
      toast.success(t("reservations.createdOk"));
      onSaved();
    } catch (err) {
      setFormError(err.friendlyMessage || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={t("reservations.formTitle")} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="equipoId">{t("reservations.equipment")}</label>
          <select
            id="equipoId"
            value={form.equipoId}
            disabled={Boolean(equipo) || loadingEquipos}
            onChange={(e) => update("equipoId", e.target.value)}
          >
            <option value="">{t("reservations.selectEquipment")}</option>
            {equipos.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.codigo} · {eq.nombre}
              </option>
            ))}
          </select>
          {fieldErrors.equipoId && <span className="field-error">{fieldErrors.equipoId}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="nombreUsuario">{t("reservations.userName")}</label>
          <input
            id="nombreUsuario"
            type="text"
            value={form.nombreUsuario}
            onChange={(e) => update("nombreUsuario", e.target.value)}
          />
          {fieldErrors.nombreUsuario && <span className="field-error">{fieldErrors.nombreUsuario}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="correoUsuario">{t("reservations.userEmail")}</label>
          <input
            id="correoUsuario"
            type="email"
            value={form.correoUsuario}
            onChange={(e) => update("correoUsuario", e.target.value)}
          />
          {fieldErrors.correoUsuario && <span className="field-error">{fieldErrors.correoUsuario}</span>}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="fechaInicio">{t("reservations.startDate")}</label>
            <input
              id="fechaInicio"
              type="datetime-local"
              value={form.fechaInicio}
              onChange={(e) => update("fechaInicio", e.target.value)}
            />
            {fieldErrors.fechaInicio && <span className="field-error">{fieldErrors.fechaInicio}</span>}
          </div>
          <div className="form-field">
            <label htmlFor="fechaFin">{t("reservations.endDate")}</label>
            <input
              id="fechaFin"
              type="datetime-local"
              value={form.fechaFin}
              onChange={(e) => update("fechaFin", e.target.value)}
            />
            {fieldErrors.fechaFin && <span className="field-error">{fieldErrors.fechaFin}</span>}
          </div>
        </div>

        {formError && <div className="form-error-banner">{formError}</div>}

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {t("reservations.newReservation")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
