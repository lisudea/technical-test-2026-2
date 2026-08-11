import { useEffect, useState } from 'react'

import { client } from '../api/client'
import { EmptyState, LoadingRow } from '../components/common/Feedback'
import { useI18n } from '../i18n/useI18n'
import { isAbortError, toDisplayableError } from '../utils/errors'
import type { DisplayableError } from '../utils/errors'
import type { TopEquipment } from '../types/api'

/**
 * Top 5 de equipos mas solicitados (bonus del Reto 2 llevado a la interfaz).
 *
 * Las barras se dibujan con CSS puro: el ancho es el porcentaje respecto al
 * equipo mas reservado. Sin librerias de graficos.
 */
export function StatisticsPage() {
  const { t } = useI18n()

  const [top, setTop] = useState<TopEquipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<DisplayableError | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    client
      .fetchTopEquipment(controller.signal)
      .then((result) => {
        setTop(result)
        setLoading(false)
      })
      .catch((caught) => {
        if (isAbortError(caught)) return
        setError(toDisplayableError(caught))
        setLoading(false)
      })

    return () => controller.abort()
  }, [])

  const maxCount = top.reduce((max, item) => Math.max(max, item.reservationCount), 0)

  return (
    <div className="stack">
      <div className="page-header">
        <h2>{t('statistics.title')}</h2>
        <p>{t('statistics.subtitle')}</p>
      </div>

      {error && !loading && (
        <div className="alert alert--error" role="alert">
          <div>
            <span className="alert__title">{t(error.titleKey)}</span>
            <div>{t(error.bodyKey)}</div>
          </div>
        </div>
      )}

      {loading && <LoadingRow labelKey="statistics.loading" />}

      {!loading && !error && top.length === 0 && (
        <div className="card">
          <EmptyState icon="📊" titleKey="statistics.empty.title" bodyKey="statistics.empty.body" />
        </div>
      )}

      {!loading && top.length > 0 && (
        <div className="panel">
          <ol className="top-list">
            {top.map((item, index) => {
              const percentage = maxCount > 0 ? (item.reservationCount / maxCount) * 100 : 0

              return (
                <li key={item.equipmentId} className="top-item">
                  <div className="top-item__head">
                    <span className="top-item__name">
                      {index + 1}. {item.equipmentName}
                    </span>
                    <span className="top-item__count">
                      {item.reservationCount === 1
                        ? t('statistics.reservation', { count: item.reservationCount })
                        : t('statistics.reservations', { count: item.reservationCount })}
                    </span>
                  </div>

                  <div
                    className="top-item__track"
                    role="meter"
                    aria-valuenow={item.reservationCount}
                    aria-valuemin={0}
                    aria-valuemax={maxCount}
                    aria-label={item.equipmentName}
                  >
                    <div className="top-item__bar" style={{ width: `${percentage}%` }} />
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </div>
  )
}