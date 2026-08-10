import { useState } from "react";
import Modal from "./Modal";
import { useLanguage } from "../i18n/LanguageContext";
import { CATEGORIAS, ESTADOS_EQUIPO_EDITABLES, crearEquipo, actualizarEquipo } from "../api/equipos";
import { useToast } from "./ToastContext";

const CODE_PATTERN = /^EQ-\d{3,}$/;

export default function EquipmentFormModal({ equipo, onClose, onSaved }) {
  const { t } = useLanguage();
  const toast = useToast();
  const isEdit = Boolean(equipo);

  const [form, setForm] = useState({
    codigo: equipo?.codigo || "",
    nombre: equipo?.nombre || "",
    numeroSerie: equipo?.numeroSerie || "",
    categoria: equipo?.categoria || CATEGORIAS[0],
    estado: ESTADOS_EQUIPO_EDITABLES.includes(equipo?.estado) ? equipo.estado : "DISPONIBLE",
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((fe) => ({ ...fe, [field]: undefined }));
  }

  function validate() {
    const errors = {};
    if (!form.codigo.trim()) errors.codigo = t("common.required");
    else if (!CODE_PATTERN.test(form.codigo.trim().toUpperCase())) errors.codigo = t("validation.codeFormat");
    if (!form.nombre.trim()) errors.nombre = t("common.required");
    if (!form.numeroSerie.trim()) errors.numeroSerie = t("common.required");
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    const payload = {
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      numeroSerie: form.numeroSerie.trim(),
      categoria: form.categoria,
      estado: form.estado,
    };

    setSubmitting(true);
    try {
      if (isEdit) {
        await actualizarEquipo(equipo.id, payload);
        toast.success(t("equipment.updatedOk"));
      } else {
        await crearEquipo(payload);
        toast.success(t("equipment.createdOk"));
      }
      onSaved();
    } catch (err) {
      setFormError(err.friendlyMessage || t("common.error"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title={isEdit ? t("equipment.formTitleEdit") : t("equipment.formTitleCreate")} onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-field">
          <label htmlFor="codigo">{t("equipment.code")}</label>
          <input
            id="codigo"
            type="text"
            placeholder="EQ-015"
            value={form.codigo}
            onChange={(e) => update("codigo", e.target.value)}
          />
          <span className="field-help">{t("equipment.codeHelp")}</span>
          {fieldErrors.codigo && <span className="field-error">{fieldErrors.codigo}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="nombre">{t("equipment.name")}</label>
          <input id="nombre" type="text" value={form.nombre} onChange={(e) => update("nombre", e.target.value)} />
          {fieldErrors.nombre && <span className="field-error">{fieldErrors.nombre}</span>}
        </div>

        <div className="form-field">
          <label htmlFor="numeroSerie">{t("equipment.serial")}</label>
          <input
            id="numeroSerie"
            type="text"
            value={form.numeroSerie}
            onChange={(e) => update("numeroSerie", e.target.value)}
          />
          {fieldErrors.numeroSerie && <span className="field-error">{fieldErrors.numeroSerie}</span>}
        </div>

        <div className="form-row">
          <div className="form-field">
            <label htmlFor="categoria">{t("equipment.category")}</label>
            <select id="categoria" value={form.categoria} onChange={(e) => update("categoria", e.target.value)}>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {t(`categories.${c}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="estado">{t("equipment.status")}</label>
            <select id="estado" value={form.estado} onChange={(e) => update("estado", e.target.value)}>
              {ESTADOS_EQUIPO_EDITABLES.map((s) => (
                <option key={s} value={s}>
                  {t(`equipoEstado.${s}`)}
                </option>
              ))}
            </select>
            <span className="field-help">{t("equipment.statusHelp")}</span>
          </div>
        </div>

        {formError && <div className="form-error-banner">{formError}</div>}

        <div className="modal-footer">
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
            {t("common.cancel")}
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {isEdit ? t("common.update") : t("common.create")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
