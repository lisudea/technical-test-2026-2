import { useState } from 'react'
import { Container } from '../components/ui/Container.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Select, Field } from '../components/ui/Form.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Pagination } from '../components/ui/Pagination.jsx'
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx'
import { Alert, EmptyState } from '../components/ui/Alert.jsx'
import { Icon } from '../components/ui/Icons.jsx'
import { EquipmentCard } from '../components/equipment/EquipmentCard.jsx'
import { ReservationFormModal } from '../components/reservations/ReservationFormModal.jsx'
import { useEquipment } from '../hooks/useEquipment.js'
import { useCategories } from '../hooks/useCategory.js'
import { EquipmentDTO } from '../models/equipment.js'
import { EQUIPMENT_STATUS_VALUES } from '../models/enums.js'

const PAGE_SIZE = 9

export default function EquipmentPage() {
  const equipment = useEquipment(PAGE_SIZE)
  const categories = useCategories()

  const [reserving, setReserving] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filtersActive = Boolean(equipment.filters.categoryId) || Boolean(equipment.filters.status)

  const openReserve = (eq) => {
    setReserving(eq)
    setModalOpen(true)
  }

  const total = equipment.data?.metadata?.totalElements ?? 0
  const loading = equipment.loading || categories.loading

  return (
    <Container>
      <PageHeader
        icon="device"
        eyebrow="Inventario"
        title="Equipos del laboratorio"
        description="Consulta todos los equipos disponibles y sus estados. Los filtros y la paginacion se realizan directamente en el servicio."
        actions={
          total > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-2xl bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-dark">
              <Icon name="chart" className="h-4 w-4" />
              {total.toLocaleString('es-CO')} equipos
            </span>
          ) : null
        }
      />

      <Card className="mb-6 p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Categoria">
            <Select
              value={equipment.filters.categoryId ?? ''}
              onChange={(e) =>
                equipment.setFilters({ categoryId: e.target.value ? Number(e.target.value) : null })
              }
            >
              <option value="">Todas las categorias</option>
              {categories.data?.map((c) => (
                <option key={c.categoryId} value={c.categoryId}>
                  {c.categoryName}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Estado">
            <Select
              value={equipment.filters.status ?? ''}
              onChange={(e) => equipment.setFilters({ status: e.target.value || '' })}
            >
              <option value="">Todos los estados</option>
              {EQUIPMENT_STATUS_VALUES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </Field>

          <div className="flex items-end">
            <Button
              variant={filtersActive ? 'primary' : 'ghost'}
              icon="close"
              disabled={!filtersActive}
              onClick={() => equipment.setFilters({ categoryId: null, status: '' })}
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="flex justify-center py-16">
          <PageLoader />
        </div>
      ) : equipment.error ? (
        <Alert tone="error" title="No fue posible cargar los equipos">
          {equipment.error.message}
        </Alert>
      ) : equipment.data?.hasItems ? (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {equipment.data.content.map((eq) => {
              const model = eq instanceof EquipmentDTO ? eq : EquipmentDTO.fromJson(eq)
              return (
                <EquipmentCard
                  key={model.equipmentId}
                  equipment={model}
                  onReserve={openReserve}
                />
              )
            })}
          </div>

          <Pagination
            page={equipment.data.metadata.number}
            totalPages={equipment.data.metadata.totalPages}
            totalElements={total}
            onPageChange={equipment.setPage}
            size={PAGE_SIZE}
            pageSizeLabel={`Pagina ${equipment.data.metadata.number + 1} de ${equipment.data.metadata.totalPages}`}
          />
        </>
      ) : (
        <EmptyState
          icon="search"
          title="No se encontraron equipos"
          description="Ajusta los filtros de categoria o estado para ver mas resultados."
          action={
            <Button variant="outline" icon="close" onClick={() => equipment.setFilters({ categoryId: null, status: '' })}>
              Quitar filtros
            </Button>
          }
        />
      )}

      <ReservationFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        equipment={reserving}
        onCreated={() => {
          equipment.reload()
          categories.reload()
        }}
      />
    </Container>
  )
}