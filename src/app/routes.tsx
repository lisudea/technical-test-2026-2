import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/ui/Layout';
import { Spinner } from '@/components/ui/Spinner';
import { RequireAuth } from '@/features/auth/components/RequireAuth';

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
