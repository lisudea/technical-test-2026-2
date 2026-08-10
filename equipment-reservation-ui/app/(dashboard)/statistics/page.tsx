'use client'

import { useMemo } from 'react'
import { TopEquipment } from '@/components/dashboard/top-equipment'
import { useTopReserved } from '@/hooks/use-top-reserved'
import { useI18n } from '@/lib/use-i18n'

export default function StatisticsPage() {
  const { dictionary } = useI18n()
  const t = dictionary.statistics
  const { topReserved, isLoading, error } = useTopReserved(5)

  const errorMessage = useMemo(() => {
    if (!error) {
      return null
    }

    return error instanceof Error ? error.message : t.errorLoading
  }, [error, t.errorLoading])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">{t.title}</h1>
        <p className="text-sm text-muted-foreground">{t.subtitle}</p>
      </div>

      <TopEquipment
        data={topReserved}
        isLoading={isLoading}
        error={errorMessage}
        labels={{
          title: t.title,
          description: t.subtitle,
          topFive: t.topFive,
          equipment: t.equipment,
          rank: t.rank,
          reservations: t.reservationCount,
          share: t.share,
          empty: t.empty,
          errorTitle: dictionary.common.error,
          errorDescription: t.errorLoading,
          loading: t.loading,
        }}
      />
    </div>
  )
}
