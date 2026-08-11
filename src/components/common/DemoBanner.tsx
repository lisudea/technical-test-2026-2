import { useEffect, useState } from 'react'

import { isDemoMode, retryRealApi, subscribeDemoMode } from '../../api/client'
import { useI18n } from '../../i18n/useI18n'

/**
 * Aviso de que la API no responde y la interfaz esta usando datos de ejemplo.
 *
 * Sustituye a la pantalla en blanco: el usuario entiende que el problema es de
 * conexion, no de la aplicacion, y puede reintentar sin recargar a ciegas.
 */
export function DemoBanner({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n()
  const [demo, setDemo] = useState(isDemoMode)

  useEffect(() => subscribeDemoMode(setDemo), [])

  if (!demo) return null

  return (
    <div className="alert alert--warning alert--banner" role="status">
      <div>
        <span className="alert__title">{t('demo.title')}</span>
        <div className="alert__detail">{t('demo.body')}</div>
      </div>

      <button
        type="button"
        className="btn btn--secondary btn--sm"
        onClick={() => {
          retryRealApi()
          onRetry()
        }}
      >
        {t('demo.retry')}
      </button>
    </div>
  )
}