'use client'

import { BarChart3, Trophy } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { TopEquipmentResponse } from '@/types/api'

type TopEquipmentLabels = {
  title: string
  description: string
  topFive: string
  equipment: string
  rank: string
  reservations: string
  share: string
  empty: string
  errorTitle: string
  errorDescription: string
  loading: string
}

interface TopEquipmentProps {
  data: TopEquipmentResponse[]
  isLoading?: boolean
  error?: string | null
  labels: TopEquipmentLabels
}

export function TopEquipment({ data, isLoading = false, error = null, labels }: TopEquipmentProps) {
  const topFive = data.slice(0, 5)
  const maxReservations = Math.max(...topFive.map((item) => item.reservationCount), 1)
  const totalReservations = topFive.reduce((sum, item) => sum + item.reservationCount, 0)

  return (
    <Card className="overflow-hidden border-border/70 shadow-sm shadow-primary/5">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
              <Trophy className="size-3.5" aria-hidden="true" />
              {labels.topFive}
            </div>
            <CardTitle className="text-balance text-xl text-foreground">{labels.title}</CardTitle>
            <CardDescription>{labels.description}</CardDescription>
          </div>
          <div className="hidden rounded-xl border border-primary/15 bg-white/80 px-4 py-3 text-right sm:block">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{labels.reservations}</div>
            <div className="text-2xl font-semibold text-primary">{totalReservations}</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>{labels.errorTitle}</AlertTitle>
            <AlertDescription>{error || labels.errorDescription}</AlertDescription>
          </Alert>
        ) : isLoading ? (
          <LoadingState labels={labels} />
        ) : topFive.length === 0 ? (
          <EmptyState labels={labels} />
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>{labels.description}</span>
              <span className="inline-flex items-center gap-2 font-medium text-foreground">
                <BarChart3 className="size-4 text-primary" aria-hidden="true" />
                {labels.reservations}: {totalReservations}
              </span>
            </div>
            <Separator />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-24">{labels.rank}</TableHead>
                  <TableHead>{labels.equipment}</TableHead>
                  <TableHead className="w-[46%]">{labels.share}</TableHead>
                  <TableHead className="text-right">{labels.reservations}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topFive.map((item, index) => {
                  const width = Math.max((item.reservationCount / maxReservations) * 100, 6)
                  const percent = Math.round((item.reservationCount / maxReservations) * 100)

                  return (
                    <TableRow key={item.equipmentId} className="align-top">
                      <TableCell>
                        <Badge variant={index === 0 ? 'default' : 'outline'} className="gap-1 rounded-full px-2.5">
                          <Trophy className="size-3" aria-hidden="true" />
                          #{index + 1}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5">
                          <span className="font-medium text-foreground">{item.equipmentName}</span>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-[#75C1C0]/20" aria-hidden="true">
                            <div
                              className={cn('h-full rounded-full bg-[#008885] transition-all duration-500')}
                              style={{ width: `${width}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {item.reservationCount} {labels.reservations.toLowerCase()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div
                            className="h-3 flex-1 rounded-full bg-muted"
                            role="progressbar"
                            aria-label={`${item.equipmentName} ${labels.share}`}
                            aria-valuemin={0}
                            aria-valuemax={maxReservations}
                            aria-valuenow={item.reservationCount}
                          >
                            <div className="h-full rounded-full bg-[#008885]" style={{ width: `${width}%` }} />
                          </div>
                          <span className="min-w-12 text-right text-xs font-medium text-foreground">{percent}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-[#007874]">{item.reservationCount}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function LoadingState({ labels }: { labels: TopEquipmentLabels }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
        <Skeleton className="size-9 rounded-full" />
        <span>{labels.loading}</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="grid grid-cols-[6rem_1fr_10rem_5rem] gap-4 rounded-xl border border-border/60 p-4">
            <Skeleton className="h-8 w-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-2.5 w-full" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-3.5 w-full self-center" />
            <Skeleton className="h-4 w-12 justify-self-end self-center" />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ labels }: { labels: TopEquipmentLabels }) {
  return (
    <Empty className="border border-dashed border-border/70 bg-muted/10 py-14">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BarChart3 className="size-4" aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{labels.empty}</EmptyTitle>
        <EmptyDescription>{labels.description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}