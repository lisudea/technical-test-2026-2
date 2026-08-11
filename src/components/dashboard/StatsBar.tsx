import { useEffect, useState } from 'react'

import { client } from '../../api/client'
import { useI18n } from '../../i18n/useI18n'
import { isAbortError } from '../../utils/errors'
import type { EquipmentStatus } from '../../types/api'

interface Counts {
  total: number
  AVAILABLE: number
  RESERVED: number
  MAINTENANCE: number
}

const EMPTY: Counts = { total: 0, AVAILABLE: 0, RESERVED: 0, MAINTENANCE: 0 }

/**
 * Resumen del inventario por estado.
 *
 * Pide una pagina grande sin filtros y cuenta en cliente. Es suficiente para
 * el inventario de un laboratorio; si la coleccion creciera mucho, lo correcto
 * seria un endpoint de resumen en el backend (queda anotado en el README).
 *
 * Si falla, el componente simplemente no se pinta: es informacion adicional y
 * no debe tumbar el tablero.
 */
export function StatsBar({ reloadToken }: { reloadToken: number }) {
  const { t } = useI18n()
  const [counts, setCounts] = useState<Counts | null>(null)

  useEffect(() => {
    const controller = new AbortController()

    client
      .fetchEquipment({ page: 0, size: 100, signal: controller.signal })
      .then((page) => {
        const next = { ...EMPTY, total: page.totalElements }

        for (const equipment of page.content) {
          next[equipment.status as EquipmentStatus] += 1
        }

        setCounts(next)
      })
      .catch((error) => {
        if (isAbortError(error)) return
        setCounts(null)
      })

    return () => controller.abort()
  }, [reloadToken])

  if (!counts) return null

  const cards = [
    { key: 'total', modifier: 'total', label: t('stats.total'), value: counts.total },
    { key: 'available', modifier: 'available', label: t('stats.available'), value: counts.AVAILABLE },
    { key: 'reserved', modifier: 'reserved', label: t('stats.reserved'), value: counts.RESERVED },
    {
      key: 'maintenance',
      modifier: 'maintenance',
      label: t('stats.maintenance'),
      value: counts.MAINTENANCE,
    },
  ]

  return (
    <div className="kpi-grid">
      {cards.map((card) => (
        <div key={card.key} className={`card kpi kpi--${card.modifier}`}>
          <div className="kpi__value">{card.value}</div>
          <div className="kpi__label">{card.label}</div>
        </div>
      ))}
    </div>
  )
}