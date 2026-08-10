import Image from 'next/image'
import { MapPin, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/equipment/status-badge'
import type { Equipment } from '@/types/equipment'

export function EquipmentCard({ equipment }: { equipment: Equipment }) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] w-full bg-muted">
        <Image
          src={equipment.imageUrl || '/images/equipment-placeholder.png'}
          alt={equipment.name}
          fill
          className="object-cover"
          crossOrigin="anonymous"
        />
        <StatusBadge code={equipment.operationalStatus.code} className="absolute top-3 left-3 shadow-sm" />
      </div>
      <CardHeader>
        <CardTitle className="text-balance leading-snug">{equipment.name}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Tag className="size-3.5 shrink-0" />
          <span className="truncate">{equipment.category.name}</span>
        </div>
        {equipment.location ? (
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">{equipment.location}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
