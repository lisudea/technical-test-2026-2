import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/ui/Layout';
import { Spinner } from '@/components/ui/Spinner';
import { RequireAuth } from '@/features/auth/components/RequireAuth';
import { RequireRole } from '@/features/auth/components/RequireRole';

const DashboardPage = lazy(() =>
  import('@/features/equipos/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
);
const EquipoDetailPage = lazy(() =>
  import('@/features/equipos/pages/EquipoDetailPage').then((m) => ({ default: m.EquipoDetailPage }))
);
const MisReservasPage = lazy(() =>
  import('@/features/reservas/pages/MisReservasPage').then((m) => ({ default: m.MisReservasPage }))
);
const EstadisticasPage = lazy(() =>
  import('@/features/estadisticas/pages/EstadisticasPage').then((m) => ({ default: m.EstadisticasPage }))
);
const LoginPage = lazy(() =>
  import('@/features/auth/pages/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const NotFoundPage = lazy(() =>
  import('@/app/NotFoundPage').then((m) => ({ default: m.NotFoundPage }))
);

// Privileged consoles. Split out lazily so a student never downloads the
// admin bundle — the code is not secret, but there is no reason to ship it.
const MesaPrestamosPage = lazy(() =>
  import('@/features/prestamos/pages/MesaPrestamosPage').then((m) => ({
    default: m.MesaPrestamosPage,
  }))
);
const AdminLayout = lazy(() =>
  import('@/features/admin/pages/AdminLayout').then((m) => ({ default: m.AdminLayout }))
);
const AdminResumenPage = lazy(() =>
  import('@/features/admin/pages/AdminResumenPage').then((m) => ({
    default: m.AdminResumenPage,
  }))
);
const AdminEquiposPage = lazy(() =>
  import('@/features/admin/pages/AdminEquiposPage').then((m) => ({
    default: m.AdminEquiposPage,
  }))
);
const AdminUsuariosPage = lazy(() =>
  import('@/features/admin/pages/AdminUsuariosPage').then((m) => ({
    default: m.AdminUsuariosPage,
  }))
);
const AdminSancionesPage = lazy(() =>
  import('@/features/admin/pages/AdminSancionesPage').then((m) => ({
    default: m.AdminSancionesPage,
  }))
);

function PageFallback() {
  const { t } = useTranslation();
  return (
    <div className="flex justify-center py-20">
      <Spinner label={t('common.loading')} />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageFallback />}>
              <DashboardPage />
            </Suspense>
          }
        />
        <Route
          path="equipos/:id"
          element={
            <Suspense fallback={<PageFallback />}>
              <EquipoDetailPage />
            </Suspense>
          }
        />
        <Route
          path="mis-reservas"
          element={
            <RequireAuth>
              <Suspense fallback={<PageFallback />}>
                <MisReservasPage />
              </Suspense>
            </RequireAuth>
          }
        />
        <Route
          path="estadisticas"
          element={
            <Suspense fallback={<PageFallback />}>
              <EstadisticasPage />
            </Suspense>
          }
        />
        {/* Loan desk — AUXILIAR and above. */}
        <Route
          path="auxiliar"
          element={
            <RequireRole role="AUXILIAR">
              <Suspense fallback={<PageFallback />}>
                <MesaPrestamosPage />
              </Suspense>
            </RequireRole>
          }
        />

        {/* Admin console — ADMIN only. The guard wraps the layout, so every
            nested section inherits it and a new tab cannot be added
            unprotected by accident. */}
        <Route
          path="admin"
          element={
            <RequireRole role="ADMIN">
              <Suspense fallback={<PageFallback />}>
                <AdminLayout />
              </Suspense>
            </RequireRole>
          }
        >
          <Route index element={<AdminResumenPage />} />
          <Route path="equipos" element={<AdminEquiposPage />} />
          <Route path="usuarios" element={<AdminUsuariosPage />} />
          <Route path="sanciones" element={<AdminSancionesPage />} />
        </Route>

        <Route
          path="login"
          element={
            <Suspense fallback={<PageFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
        <Route
          path="404"
          element={
            <Suspense fallback={<PageFallback />}>
              <NotFoundPage />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
