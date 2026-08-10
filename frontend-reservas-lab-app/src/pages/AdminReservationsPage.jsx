import { Container } from '../components/ui/Container.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Pagination } from '../components/ui/Pagination.jsx'
import { PageLoader } from '../components/ui/Spinner.jsx'
import { Alert, EmptyState } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'
import { CancelReservationButton } from '../components/reservations/CancelReservationButton.jsx'
import { ReservationStatusFilter } from '../components/reservations/ReservationStatusFilter.jsx'
import { useReservationCatalog, useReservationFilter } from '../hooks/useReservation.js'
import { formatRange } from '../utils/format.js'
import { ReservationStatus } from '../models/enums.js'

const PAGE_SIZE = 10

const EMPTY_MESSAGES = {
  activas: {
    title: 'No hay reservas activas',
    description: 'Cuando los usuarios creen reservas apareceran aqui.',
  },
  canceladas: {
    title: 'No hay reservas canceladas',
    description: 'Las reservas que los usuarios cancelen se guardaran aqui junto con su historico.',
  },
  todas: {
    title: 'No hay reservas registradas',
    description: 'Cuando los usuarios creen reservas apareceran aqui.',
  },
}

export default function AdminReservationsPage() {
  const catalog = useReservationCatalog('all')
  const {
    statusFilter,
    setStatusFilter,
    pageItems,
    total,
    totalPages,
    page,
    setPage,
  } = useReservationFilter(catalog.items, 'activas', PAGE_SIZE)

  return (
    <Container wide>
      <PageHeader
        icon="calendarPlus"
        eyebrow="Administracion"
        title="Todas las reservas"
        description="Vista administrativa de las reservas de todos los usuarios del laboratorio."
        actions={
          <Button variant="outline" icon="chart" size="sm" onClick={catalog.reload}>
            Actualizar
          </Button>
        }
      />

      <div className="mb-6">
        <ReservationStatusFilter
          value={statusFilter}
          onChange={setStatusFilter}
          counts={{
            activas: catalog.active.length,
            canceladas: catalog.cancelled.length,
            todas: catalog.total,
          }}
        />
      </div>

      {catalog.loading ? (
        <div className="flex justify-center py-16">
          <PageLoader />
        </div>
      ) : catalog.error ? (
        <Alert tone="error" title="No fue posible cargar las reservas">
          {catalog.error.message}
        </Alert>
      ) : total > 0 ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="hidden grid-cols-12 gap-3 border-b border-line bg-primary-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-primary-dark md:grid">
              <span className="col-span-3">Equipo</span>
              <span className="col-span-3">Usuario</span>
              <span className="col-span-4">Horario</span>
              <span className="col-span-1 text-center">Estado</span>
              <span className="col-span-1" />
            </div>

            <div className="divide-y divide-line">
              {pageItems.map((reservation) => (
                <div
                  key={reservation.reservationId}
                  className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-12 md:items-center md:gap-3"
                >
                  <div className="col-span-3 min-w-0">
                    <p className="font-semibold text-ink">{reservation.equipmentName}</p>
                    <p className="font-mono text-xs text-muted">#{reservation.reservationId}</p>
                  </div>

                  <div className="col-span-3 min-w-0">
                    <p className="text-sm font-medium text-ink">{reservation.userName}</p>
                    <p className="truncate text-xs text-muted">{reservation.userEmail}</p>
                  </div>

                  <div className="col-span-4 text-sm text-muted">
                    <span className="font-medium text-ink">
                      {formatRange(reservation.startTime, reservation.endTime)}
                    </span>
                  </div>

                  <div className="col-span-1 flex justify-start md:justify-center">
                    <StatusBadge status={reservation.status} variant="reservation" />
                  </div>

                  <div className="col-span-1 flex justify-end">
                    {reservation.status === ReservationStatus.CREADA &&
                    new Date(reservation.endTime) > new Date() ? (
                      <CancelReservationButton
                        reservation={reservation}
                        onDone={catalog.reload}
                      />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            totalElements={total}
            onPageChange={setPage}
            pageSizeLabel="Todas las reservas"
          />
        </>
      ) : (
        <EmptyState
          icon="calendar"
          title={EMPTY_MESSAGES[statusFilter].title}
          description={EMPTY_MESSAGES[statusFilter].description}
        />
      )}
    </Container>
  )
}