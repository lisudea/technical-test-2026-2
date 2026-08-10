import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { PageLoader } from './ui/Spinner.jsx'
import { Role } from '../models/enums.js'

/**
 * Ruta protegida. Redirige a /login si no hay sesion y a un aviso de acceso
 * denegado cuando el rol no coincide con lo requerido.
 */
export function ProtectedRoute({ requireAdmin = false, children }) {
  const { isAuthenticated, user, restoring } = useAuth()

  if (restoring) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <PageLoader />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user?.role !== Role.ADMINISTRADOR) {
    return <Navigate to="/" replace />
  }

  return children
}