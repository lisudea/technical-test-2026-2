import { StatusBadge } from '../ui/StatusBadge.jsx'
import { Button } from '../ui/Button.jsx'
import { Icon } from '../ui/Icons.jsx'

/**
 * Tarjeta de equipo: se reutiliza en el explorador de equipos y en la gestion
 * del administrador.
 */
export function EquipmentCard({
  equipment,
  onReserve,
  onEdit,
  onDelete,
  showActions = false,
}) {
  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary">
          <Icon name="device" className="h-5 w-5" />
        </div>
        <StatusBadge status={equipment.status} variant="equipment" />
      </div>

      <h3 className="mt-3 font-bold text-ink">{equipment.equipmentName}</h3>
      <p className="mt-1 text-xs text-muted">
        Categoria: <span className="font-medium text-ink">{equipment.categoryName}</span>
      </p>
      <p className="mt-0.5 font-mono text-xs text-muted">Serial/MAC: {equipment.macNumber}</p>

      {showActions ? (
        <div className="mt-4 flex gap-2 border-t border-line pt-3">
          <Button variant="outline" icon="pencil" size="sm" onClick={() => onEdit?.(equipment)}>
            Editar
          </Button>
          <Button variant="danger" icon="trash" size="sm" onClick={() => onDelete?.(equipment)}>
            Eliminar
          </Button>
        </div>
      ) : onReserve ? (
        <div className="mt-4 border-t border-line pt-3">
          <Button
            variant={equipment.isReservable ? 'primary' : 'soft'}
            icon="calendarPlus"
            className="w-full"
            disabled={!equipment.isReservable}
            title={equipment.isReservable ? 'Reservar equipo' : 'Equipo en mantenimiento'}
            onClick={() => onReserve(equipment)}
          >
            {equipment.isReservable ? 'Reservar' : 'No disponible'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}