'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import type { TopReservedEquipment } from '@/types/statistics'
import { dictionary } from '@/lib/i18n'

const chartConfig: ChartConfig = {
  reservationCount: {
    label: dictionary.statistics.reservationCount,
    color: 'var(--chart-1)',
  },
}

export function TopReservedChart({ data }: { data: TopReservedEquipment[] }) {
  const chartData = data.map((item) => ({
    name: item.equipmentName,
    reservationCount: item.reservationCount,
  }))

  return (
    <ChartContainer config={chartConfig} className="h-80 w-full">
      <BarChart data={chartData} layout="vertical" margin={{ left: 12, right: 12 }}>
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tickLine={false}
          axisLine={false}
          width={140}
          className="text-xs"
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="reservationCount" fill="var(--color-reservationCount)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}
