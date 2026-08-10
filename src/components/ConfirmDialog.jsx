import Modal from "./Modal";
import { useLanguage } from "../i18n/LanguageContext";

export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  cancelLabel,
  danger = true,
  loading = false,
  onConfirm,
  onClose,
}) {
  const { t } = useLanguage();

  return (
    <Modal title={title} onClose={onClose} width={420}>
      <p className="confirm-message">{message}</p>
      <div className="modal-footer">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
          {cancelLabel || t("common.cancel")}
        </button>
        <button
          type="button"
          className={danger ? "btn btn-danger" : "btn btn-primary"}
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmLabel || t("common.confirm")}
        </button>
      </div>
    </Modal>
  );
}
