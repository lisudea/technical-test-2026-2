import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { Container } from '../components/ui/Container.jsx'
import { Card } from '../components/ui/Card.jsx'
import { Icon } from '../components/ui/Icons.jsx'
import { Button } from '../components/ui/Button.jsx'
import { PageLoader, Spinner } from '../components/ui/Spinner.jsx'
import { EmptyState, Alert } from '../components/ui/Alert.jsx'
import { ReservationCard } from '../components/reservations/ReservationCard.jsx'
import { equipmentApi, userApi } from '../api'
import { useReservationCatalog } from '../hooks/useReservation.js'
import { useLoadable } from '../hooks/useLoadable.js'
import { Role } from '../models/enums.js'

function StatCard({ icon, label, value, loading, accent = 'primary' }) {
  const accents = {
    primary: 'bg-primary-50 text-primary',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    blue: 'bg-sky-100 text-sky-700',
    red: 'bg-red-100 text-red-600',
  }
  return (
    <Card className="flex items-center gap-3 p-4">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accents[accent]}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        {loading ? (
          <Spinner className="h-5 w-5" label="" />
        ) : (
          <p className="text-2xl font-bold text-ink">{value}</p>
        )}
        <p className="text-xs text-muted">{label}</p>
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === Role.ADMINISTRADOR
  const scope = isAdmin ? 'all': 'mine';
  const catalog = useReservationCatalog(scope)
  const available = useLoadable(() => equipmentApi.listEquipment({ page: 0, size: 1, status: 'Disponible' }), [])
  const equipments = useLoadable(() => equipmentApi.listEquipment({ page: 0, size: 1 }), [])
  const users = useLoadable(
    () =>
      isAdmin
        ? userApi.listUsers({ page: 0, size: 1 })
        : Promise.resolve({ content: [], metadata: { totalElements: 0 } }),
    [isAdmin],
  )

  const upcoming = catalog.active
    .filter((r) => new Date(r.endTime) > new Date())
    .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
    .slice(0, 4)

  const canReserve = upcoming.length

  const onChanged = async () => {
    await Promise.all([catalog.reload(), available.reload()])
  }

  return (
    <Container>
      <div className="rounded-3xl bg-primary px-6 py-8 text-white sm:px-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary-light">Panel de reservas</p>
        <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
          Hola, {user?.name} 👋
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-primary-50/90 sm:text-base">
          Gestiona tus reservas de equipos del Laboratorio Integrado de Sistemas. Explora el
          inventario, filtra por categoria o estado y reserva en el horario que necesites.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/equipos">
            <Button variant="soft" icon="device">Explorar equipos</Button>
          </Link>
          <Link to="/reservas">
            <Button variant="soft" icon="calendar">Mis reservas</Button>
          </Link>
          {isAdmin ? (
            <Link to="/admin/reservas">
              <Button variant="soft" icon="shield">Gestionar (admin)</Button>
            </Link>
          ) : null}
        </div>
      </div>

      <div
        className={`mt-6 grid grid-cols-2 gap-3 sm:gap-4 ${isAdmin ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}
      >
        <StatCard
          icon="calendar"
          label="Reservas registradas"
          value={catalog.total.toLocaleString('es-CO')}
          loading={catalog.loading}
        />
        <StatCard
          icon="clock"
          label="Reservas activas"
          value={catalog.active.length.toLocaleString('es-CO')}
          loading={catalog.loading}
          accent="green"
        />
        {isAdmin ? (
          <StatCard
            icon="ban"
            label="Reservas canceladas"
            value={catalog.cancelled.length.toLocaleString('es-CO')}
            loading={catalog.loading}
            accent="red"
          />
        ) : null}
        <StatCard
          icon="device"
          label="Equipos disponibles"
          value={(available.data?.metadata?.totalElements ?? 0).toLocaleString('es-CO')}
          loading={available.loading}
          accent="amber"
        />
        {isAdmin ? (
          <StatCard
            icon="users"
            label="Usuarios registrados"
            value={(users.data?.metadata?.totalElements ?? 0).toLocaleString('es-CO')}
            loading={users.loading}
            accent="blue"
          />
        ) : (
          <StatCard
            icon="monitor"
            label="Total equipos"
            value={(equipments.data?.metadata?.totalElements ?? 0).toLocaleString('es-CO')}
            loading={equipments.loading}
            accent="blue"
          />
        )}
      </div>

      <div className="mt-8">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-primary-dark">Proximas reservas</h2>
              <p className="text-sm text-muted">
                {canReserve > 0
                  ? 'Reservas activas en los proximos dias.'
                  : 'No tienes reservas activas en este momento.'}
              </p>
            </div>
            { isAdmin? (
            <Link to="/admin/reservas">
              <Button variant="outline" iconRight="arrowRight" size="sm">
                Ver todas
              </Button>
            </Link>
            ) : (
              <Link to="/reservas">
                <Button variant="outline" iconRight="arrowRight" size="sm">
                  Ver todas
                </Button>
              </Link>
            )
            }
          </div>

          <div className="p-5">
            {catalog.loading ? (
              <div className="flex justify-center py-10">
                <PageLoader />
              </div>
            ) : catalog.error ? (
              <Alert tone="error" title="No se pudieron cargar las reservas">
                {catalog.error.message}
              </Alert>
            ) : upcoming.length === 0 ? (
              <EmptyState
                icon="calendar"
                title="Aun no tienes reservas activas"
                description="Explora los equipos disponibles del laboratorio y crea tu primera reserva."
                action={
                  <Link to="/equipos">
                    <Button icon="calendarPlus">Reservar ahora</Button>
                  </Link>
                }
              />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {upcoming.map((reservation) => (
                  <ReservationCard key={reservation.reservationId} reservation={reservation} onChanged={onChanged} />
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </Container>
  )
}