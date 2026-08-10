import { Routes, Route, Outlet } from 'react-router-dom'
import { Layout } from './components/layout/Layout.jsx'
import { ProtectedRoute } from './components/ProtectedRoute.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import EquipmentPage from './pages/EquipmentPage.jsx'
import ReservationsPage from './pages/ReservationsPage.jsx'
import AdminReservationsPage from './pages/AdminReservationsPage.jsx'
import AdminEquipmentPage from './pages/AdminEquipmentPage.jsx'
import AdminUsersPage from './pages/AdminUsersPage.jsx'
import AdminCategoriesPage from './pages/AdminCategoriesPage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="equipos" element={<EquipmentPage />} />
        <Route path="reservas" element={<ReservationsPage />} />

        <Route
          element={
            <ProtectedRoute requireAdmin>
              <Outlet />
            </ProtectedRoute>
          }
        >
          <Route path="admin/reservas" element={<AdminReservationsPage />} />
          <Route path="admin/equipos" element={<AdminEquipmentPage />} />
          <Route path="admin/usuarios" element={<AdminUsersPage />} />
          <Route path="admin/categorias" element={<AdminCategoriesPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}