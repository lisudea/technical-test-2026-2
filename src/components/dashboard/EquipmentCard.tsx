import { useI18n } from '../../i18n/useI18n'
import { StatusBadge } from './StatusBadge'
import type { Equipment } from '../../types/api'

interface EquipmentCardProps {
  equipment: Equipment
  onReserve: (equipment: Equipment) => void
  onEdit?: (equipment: Equipment) => void
}

export function EquipmentCard({ equipment, onReserve, onEdit }: EquipmentCardProps) {
  const { t } = useI18n()

  // Un equipo en mantenimiento no esta operativo: se deshabilita el boton y se
  // explica por que con un title, en lugar de dejar que el usuario lo intente
  // y reciba un error.
  const cannotReserve = equipment.status === 'MAINTENANCE'

  return (
    <article className={`card equipment-card equipment-card--${equipment.status}`}>
      <div className="equipment-card__head">
        <h3 className="equipment-card__name">{equipment.name}</h3>
        <StatusBadge status={equipment.status} />
      </div>

      <div>
        <p className="equipment-card__serial">
          {t('equipment.serial')}: {equipment.serialNumber}
        </p>
        <div className="equipment-card__meta mt-2">
          <span className="chip">{t(`category.${equipment.category}`)}</span>
        </div>
      </div>

      <div className="equipment-card__actions">
        <button
          type="button"
          className="btn btn--primary btn--sm"
          onClick={() => onReserve(equipment)}
          disabled={cannotReserve}
          title={cannotReserve ? t('equipment.cannotReserve') : undefined}
        >
          {t('equipment.reserve')}
        </button>

        {onEdit && (
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            onClick={() => onEdit(equipment)}
          >
            {t('equipment.edit')}
          </button>
        )}
      </div>
    </article>
  )
}