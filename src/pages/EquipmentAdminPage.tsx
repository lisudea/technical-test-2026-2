import { useCallback, useState } from 'react'

import { EquipmentForm } from '../components/equipment/EquipmentForm'
import { EquipmentCard } from '../components/dashboard/EquipmentCard'
import { EmptyState, SkeletonCard } from '../components/common/Feedback'
import { Pagination } from '../components/dashboard/Pagination'
import { ReserveModal } from '../components/reservation/ReserveModal'
import { useAuth } from '../auth/useAuth'
import { useEquipment } from '../hooks/useEquipment'
import { useI18n } from '../i18n/useI18n'
import type { Equipment } from '../types/api'

/**
 * Gestion del inventario: registrar equipos nuevos y actualizar los existentes.
 *
 * No lo exige el Reto 3, pero hace visibles desde la interfaz los requisitos
 * obligatorios de "registro y actualizacion de equipos" del Reto 2.
 *
 * Requiere sesion iniciada. Administrar el catalogo es una accion de gestion,
 * no de uso: cualquiera puede consultar y reservar, pero dar de alta o editar
 * equipos exige una cuenta institucional. El backend aplica la misma regla
 * (app.security.protect-equipment), asi que ocultar el formulario es una
 * cortesia hacia el usuario, no la barrera de seguridad.
 */
export function EquipmentAdminPage() {
  const { t } = useI18n()
  const { user, login } = useAuth()
  const { items, page, pageNumber, setPageNumber, size, setSize, loading, refresh } = useEquipment()

  const [editing, setEditing] = useState<Equipment | null>(null)
  const [reserving, setReserving] = useState<Equipment | null>(null)

  const puedeGestionar = user !== null

  const handleSaved = useCallback(() => {
    setEditing(null)
    refresh()
  }, [refresh])

  return (
    <div className="stack">
      <div className="page-header">
        <h2>{t('admin.title')}</h2>
        <p>{t('admin.subtitle')}</p>
      </div>

      <div className="split">
        <div className="stack">
          <h3 className="panel__title">{t('admin.listTitle')}</h3>

          {loading && (
            <div className="equipment-grid" aria-busy="true">
              {Array.from({ length: 4 }, (_, index) => (
                <SkeletonCard key={index} />
              ))}
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="card">
              <EmptyState icon="📦" titleKey="dashboard.empty.title" bodyKey="dashboard.empty.body" />
            </div>
          )}

          {!loading && items.length > 0 && (
            <>
              <div className="equipment-grid">
                {items.map((equipment) => (
                  <EquipmentCard
                    key={equipment.id}
                    equipment={equipment}
                    onReserve={setReserving}
                    // Sin sesion no se ofrece el boton de editar.
                    onEdit={puedeGestionar ? setEditing : undefined}
                  />
                ))}
              </div>

              {page && (
                <Pagination
                  page={pageNumber}
                  totalPages={page.totalPages}
                  size={size}
                  first={page.first}
                  last={page.last}
                  onPageChange={setPageNumber}
                  onSizeChange={(next) => {
                    setSize(next)
                    setPageNumber(0)
                  }}
                />
              )}
            </>
          )}
        </div>

        {puedeGestionar ? (
          <EquipmentForm
            editing={editing}
            onSaved={handleSaved}
            onCancelEdit={() => setEditing(null)}
          />
        ) : (
          <div className="panel">
            <h3 className="panel__title">{t('admin.loginRequired.title')}</h3>
            <p className="text-sm text-muted">{t('admin.loginRequired.body')}</p>

            <button type="button" className="btn btn--primary btn--block mt-4" onClick={login}>
              <span aria-hidden="true">🔐</span>
              {t('auth.login')}
            </button>

            <p className="field__hint mt-2">{t('auth.institutionalOnly')}</p>
          </div>
        )}
      </div>

      {reserving && (
        <ReserveModal
          equipment={reserving}
          onClose={() => setReserving(null)}
          onCreated={refresh}
        />
      )}
    </div>
  )
}