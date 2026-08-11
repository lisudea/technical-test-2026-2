import { useContext, useMemo } from 'react'

import { ToastContext } from './ToastProvider'
import { useI18n } from '../i18n/useI18n'
import { toDisplayableError } from '../utils/errors'
import type { TranslationKey, TranslationParams } from '../i18n/types'

/**
 * Avisos al usuario, ya traducidos.
 *
 * `showError` es la pieza central del requisito 6 del Reto 3: recibe el error
 * crudo del backend y lo convierte en un mensaje amigable en el idioma activo,
 * anadiendo el texto original del servidor como detalle secundario.
 */
export function useToast() {
  const context = useContext(ToastContext)
  const { t } = useI18n()

  if (!context) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>')
  }

  const { push, dismiss, toasts } = context

  return useMemo(
    () => ({
      toasts,
      dismiss,

      /** Convierte cualquier error de la API en un aviso comprensible. */
      showError(error: unknown) {
        const displayable = toDisplayableError(error)

        push({
          variant: 'error',
          title: t(displayable.titleKey),
          body: t(displayable.bodyKey),
          detail: displayable.detail,
        })
      },

      showSuccess(key: TranslationKey, params?: TranslationParams) {
        push({ variant: 'success', title: t(key, params), body: '' })
      },

      showWarning(key: TranslationKey, params?: TranslationParams) {
        push({ variant: 'warning', title: t(key, params), body: '' })
      },
    }),
    [push, dismiss, toasts, t],
  )
}