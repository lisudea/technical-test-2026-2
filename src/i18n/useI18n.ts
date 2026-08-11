import { useContext } from 'react'

import { I18nContext } from './I18nProvider'
import type { I18nContextValue } from './I18nProvider'

/**
 * Acceso a las traducciones y a los formateadores de fecha del idioma activo.
 *
 *   const { t, lang, setLang, formatDateTime } = useI18n()
 *   t('errors.CONFLICT.body')
 *   t('pagination.info', { current: 1, total: 3 })
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)

  if (!context) {
    throw new Error('useI18n debe usarse dentro de <I18nProvider>')
  }

  return context
}