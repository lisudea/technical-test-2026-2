import { useI18n } from '../../i18n/useI18n'
import type { TranslationKey } from '../../i18n/types'

/** Rueda de carga para botones y filas de tabla. */
export function Spinner() {
  return <span className="spinner" aria-hidden="true" />
}

/** Linea de carga con texto traducido. */
export function LoadingRow({ labelKey }: { labelKey: TranslationKey }) {
  const { t } = useI18n()

  return (
    <div className="loading-row" role="status">
      <Spinner />
      <span>{t(labelKey)}</span>
    </div>
  )
}

/** Placeholder de tarjeta mientras llegan los datos. */
export function SkeletonCard() {
  return (
    <div className="card skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-line" style={{ width: '65%' }} />
      <div className="skeleton skeleton-line" style={{ width: '40%' }} />
      <div className="skeleton skeleton-line" style={{ width: '85%' }} />
      <div className="skeleton skeleton-line" style={{ width: '50%', height: 36 }} />
    </div>
  )
}

interface EmptyStateProps {
  icon?: string
  titleKey: TranslationKey
  bodyKey: TranslationKey
  action?: React.ReactNode
}

export function EmptyState({ icon = '📭', titleKey, bodyKey, action }: EmptyStateProps) {
  const { t } = useI18n()

  return (
    <div className="empty-state">
      <div className="empty-state__icon" aria-hidden="true">
        {icon}
      </div>
      <p className="empty-state__title">{t(titleKey)}</p>
      <p className="empty-state__body">{t(bodyKey)}</p>
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}