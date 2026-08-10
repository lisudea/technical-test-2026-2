import { Link } from 'react-router-dom'
import { Container } from '../components/ui/Container.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Pagination } from '../components/ui/Pagination.jsx'
import { PageLoader } from '../components/ui/Spinner.jsx'
import { Alert, EmptyState } from '../components/ui/Alert.jsx'
import { Button } from '../components/ui/Button.jsx'
import { ReservationCard } from '../components/reservations/ReservationCard.jsx'
import { ReservationStatusFilter } from '../components/reservations/ReservationStatusFilter.jsx'
import { useReservationCatalog, useReservationFilter } from '../hooks/useReservation.js'

const PAGE_SIZE = 10

const EMPTY_MESSAGES = {
  activas: {
    title: 'No tienes reservas activas',
    description: 'Cuando reserves un equipo este aparecera aqui hasta que se cumpla o la canceles.',
  },
  canceladas: {
    title: 'No tienes reservas canceladas',
    description: 'Las reservas que canceles se guardaran aqui junto con su historico.',
  },
  todas: {
    title: 'No tienes reservas',
    description: 'Registra tu primera reserva explorando los equipos disponibles del laboratorio.',
  },
}

export default function ReservationsPage() {
  const catalog = useReservationCatalog('mine')
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
    <Container>
      <PageHeader
        icon="calendar"
        eyebrow="Mi panel"
        title="Mis reservas"
        description="Aqui solo aparecen tus propias reservas. Filtra por estado para revisar activas o canceladas."
        actions={
          <Link to="/equipos">
            <Button icon="calendarPlus">Nueva reserva</Button>
          </Link>
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
        <Alert tone="error" title="No fue posible cargar tus reservas">
          {catalog.error.message}
        </Alert>
      ) : total > 0 ? (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {pageItems.map((reservation) => (
              <ReservationCard
                key={reservation.reservationId}
                reservation={reservation}
                onChanged={catalog.reload}
              />
            ))}
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            totalElements={total}
            pageSizeLabel="Tus reservas"
          />
        </>
      ) : (
        <EmptyState
          icon="calendar"
          title={EMPTY_MESSAGES[statusFilter].title}
          description={EMPTY_MESSAGES[statusFilter].description}
          action={
            statusFilter !== 'todas' ? (
              <Button
                icon="layoutList"
                onClick={() => setStatusFilter('todas')}
              >
                Ver el historico completo
              </Button>
            ) : (
              <Link to="/equipos">
                <Button icon="device">Explorar equipos</Button>
              </Link>
            )
          }
        />
      )}
    </Container>
  )
}