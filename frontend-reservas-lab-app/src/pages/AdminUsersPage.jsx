import { Container } from '../components/ui/Container.jsx'
import { PageHeader } from '../components/ui/PageHeader.jsx'
import { Pagination } from '../components/ui/Pagination.jsx'
import { PageLoader } from '../components/ui/Spinner.jsx'
import { Alert, EmptyState } from '../components/ui/Alert.jsx'
import { StatusBadge } from '../components/ui/StatusBadge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Icon } from '../components/ui/Icons.jsx'
import { useUsers } from '../hooks/useUser.js'

const PAGE_SIZE = 10

export default function AdminUsersPage() {
  const users = useUsers(PAGE_SIZE)
  const page = users.data

  return (
    <Container wide>
      <PageHeader
        icon="users"
        eyebrow="Administracion"
        title="Usuarios registrados"
        description="Todos los usuarios de la plataforma, con su rol y correo institucional."
        actions={
          page ? (
            <Button variant="outline" icon="chart" size="sm" onClick={users.reload}>
              Actualizar
            </Button>
          ) : null
        }
      />

      {users.loading && !page ? (
        <div className="flex justify-center py-16">
          <PageLoader />
        </div>
      ) : users.error ? (
        <Alert tone="error" title="No fue posible cargar los usuarios">
          {users.error.message}
        </Alert>
      ) : page?.hasItems ? (
        <>
          <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
            <div className="hidden grid-cols-12 gap-3 border-b border-line bg-primary-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-primary-dark md:grid">
              <span className="col-span-1">Id</span>
              <span className="col-span-3">Nombre</span>
              <span className="col-span-5">Correo</span>
              <span className="col-span-3 text-center">Rol</span>
            </div>

            <div className="divide-y divide-line">
              {page.content.map((user) => (
                <div
                  key={user.userId}
                  className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-12 md:items-center"
                >
                  <div className="col-span-1 flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {user.fullName
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((w) => w.charAt(0).toUpperCase())
                        .join('')}
                    </span>
                    <span className="text-sm font-semibold text-muted md:hidden">
                      #{user.userId} · {user.fullName}
                    </span>
                    <span className="hidden text-sm font-semibold text-muted md:block">
                      {user.userId}
                    </span>
                  </div>

                  <div className="col-span-3 text-sm font-medium text-ink">{user.fullName}</div>

                  <div className="col-span-5 flex items-center gap-2 text-sm text-muted">
                    <Icon name="user" className="h-4 w-4 text-primary" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <div className="col-span-3 flex justify-start md:justify-center">
                    <StatusBadge status={user.role} variant="role" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Pagination
            page={page.metadata.number}
            totalPages={page.metadata.totalPages}
            totalElements={page.metadata.totalElements}
            onPageChange={users.setPage}
            pageSizeLabel="Usuarios"
          />
        </>
      ) : (
        <EmptyState
          icon="users"
          title="No hay usuarios registrados"
          description="Los usuarios apareceran aqui al registrarse con su correo institucional."
        />
      )}
    </Container>
  )
}