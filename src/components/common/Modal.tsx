import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

import { useI18n } from '../../i18n/useI18n'

interface ModalProps {
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/**
 * Dialogo accesible.
 *
 * - `role="dialog"` + `aria-modal` para los lectores de pantalla.
 * - Cierra con Escape y con clic en el fondo.
 * - Bloquea el scroll de la pagina mientras esta abierto.
 * - Lleva el foco al dialogo al abrirlo y lo devuelve al cerrarlo, para que
 *   quien navega con teclado no acabe perdido al final del documento.
 */
export function Modal({ title, onClose, children, footer }: ModalProps) {
  const { t } = useI18n()
  const dialogRef = useRef<HTMLDivElement>(null)
  const previouslyFocused = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocused.current = document.activeElement as HTMLElement | null

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // Primer campo enfocable del dialogo, o el propio dialogo si no hay ninguno.
    const focusTarget =
      dialogRef.current?.querySelector<HTMLElement>(
        'input, select, textarea, button:not([disabled])',
      ) ?? dialogRef.current

    focusTarget?.focus()

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused.current?.focus()
    }
  }, [onClose])

  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        // Solo cierra si el clic empieza en el fondo, no si el usuario
        // arrastra desde dentro del dialogo hacia fuera al seleccionar texto.
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        ref={dialogRef}
        tabIndex={-1}
      >
        <div className="modal__header">
          <h3 className="modal__title">{title}</h3>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label={t('common.close')}
          >
            &times;
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer && <div className="modal__footer">{footer}</div>}
      </div>
    </div>
  )
}