import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/features/auth/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label={t('common.loading')} />
      </div>
    );
  }

  if (!isAuthenticated) {
    const from = location.pathname + location.search;
    return <Navigate to={`/login?from=${encodeURIComponent(from)}`} replace />;
  }

  return <>{children}</>;
}

/** Inline guard (renders a login prompt instead of redirecting). */
export function RequireAuthInline({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <>{children}</>;
  return (
    <EmptyState
      title={t('reservas.loginRequired')}
      icon={<Spinner />}
      action={null}
    />
  );
}
