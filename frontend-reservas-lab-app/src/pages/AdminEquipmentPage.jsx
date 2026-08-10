import { useState } from 'react'
import { Container } from '../components/ui/Container.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Select, Field } from '../components/ui/Form.jsx'
import { Pagination } from '../components/ui/Pagination.jsx'
import { PageLoader } from '../components/ui/Spinner.jsx'
import { Alert, EmptyState } from '../components/ui/Alert.jsx'
import { EquipmentCard } from '../components/equipment/EquipmentCard.jsx'
import {
  EquipmentFormModal,
  DeleteEquipmentDialog,
} from '../components/equipment/EquipmentFormModal.jsx'
import { useToast, messageFromError } from '../components/ui/Toast.jsx'
import { useEquipment } from '../hooks/useEquipment.js'
import { useCategories } from '../hooks/useCategory.js'
import { EQUIPMENT_STATUS_VALUES } from '../models/enums.js'

const PAGE_SIZE = 9

export default function AdminEquipmentPage() {
  const equipment = useEquipment(PAGE_SIZE)
  const categories = useCategories()
  const toast = useToast()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const filtersActive = Boolean(equipment.filters.categoryId) || Boolean(equipment.filters.status)

  const handleSave = async (payload, isEdit) => {
    if (isEdit) {
      await equipment.update(editing.equipmentId, payload)
    } else {
      await equipment.create(payload)
    }
    equipment.reload()
    categories.reload()
  }

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }

  const openEdit = (eq) => {
    setEditing(eq)
    setModalOpen(true)
  }

  const handleDelete = async () => {
    setDeleteBusy(true)
    try {
      await equipment.remove(deleting.equipmentId)
      toast.success('Equipo eliminado.')
      setDeleting(null)
      equipment.reload()
    } catch (err) {
      toast.error(messageFromError(err))
      setDeleting(null)
    } finally {
      setDeleteBusy(false)
    }
  }

  const total = equipment.data?.metadata?.totalElements ?? 0

  return (
    <Container>
      <PageHeader
        icon="wrench"
        eyebrow="Administracion"
        title="Gestion de equipos"
        description="Actualiza la informacion de los equipos, cambia sus estados o agrega equipos nuevos al inventario."
        actions={
          <>
            {total > 0 ? (
              <span className="inline-flex items-center rounded-2xl bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-dark">
                {total.toLocaleString('es-CO')} equipos
              </span>
            ) : null}
            <Button icon="plus" onClick={openCreate}>
              Nuevo equipo
            </Button>
          </>
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

      {equipment.loading || categories.loading ? (
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
            {equipment.data.content.map((eq) => (
              <EquipmentCard
                key={eq.equipmentId}
                equipment={eq}
                showActions
                onEdit={openEdit}
                onDelete={(target) => setDeleting(target)}
              />
            ))}
          </div>
          <Pagination
            page={equipment.data.metadata.number}
            totalPages={equipment.data.metadata.totalPages}
            totalElements={total}
            onPageChange={equipment.setPage}
            size={PAGE_SIZE}
            pageSizeLabel="Inventario"
          />
        </>
      ) : (
        <EmptyState
          icon="device"
          title="No hay equipos registrados"
          description="Registra el primer equipo del laboratorio."
          action={
            <Button icon="plus" onClick={openCreate}>
              Nuevo equipo
            </Button>
          }
        />
      )}

      <EquipmentFormModal
        open={modalOpen}
        equipment={editing}
        categories={categories.data ?? []}
        submitting={equipment.loading}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />

      <DeleteEquipmentDialog
        open={Boolean(deleting)}
        equipment={deleting}
        busy={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </Container>
  )
}