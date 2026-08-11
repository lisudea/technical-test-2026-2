import { useToast } from './useToast'
import { useI18n } from '../i18n/useI18n'

/**
 * Pila de avisos.
 *
 * `role="status"` + `aria-live="polite"` hacen que los lectores de pantalla
 * anuncien el mensaje sin interrumpir lo que el usuario esta haciendo.
 */
export function Toaster() {
  const { toasts, dismiss } = useToast()
  const { t } = useI18n()

  if (toasts.length === 0) return null

  return (
    <div className="toaster" role="status" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.variant}`}>
          <div className="toast__content">
            <div className="toast__title">{toast.title}</div>
            {toast.body && <div className="toast__body">{toast.body}</div>}
            {toast.detail && <div className="toast__detail">{toast.detail}</div>}
          </div>

          <button
            type="button"
            className="toast__close"
            onClick={() => dismiss(toast.id)}
            aria-label={t('errors.dismiss')}
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  )
}