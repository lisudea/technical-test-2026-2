import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import type { Rol } from '@/lib/types';

interface RequireRoleProps {
  role: Rol;
  children: React.ReactNode;
}

/**
 * Route guard for the privileged consoles.
 *
 * <p>It distinguishes the two failure modes instead of collapsing them:
 * an anonymous visitor is redirected to the login screen (they can fix
 * that), while a signed-in user without the role is shown a plain refusal
 * (they cannot). Bouncing the second case to `/login` would hand them back
 * the same identity that was just refused — an infinite, confusing loop.
 *
 * <p>This is convenience and clarity, never security. Every endpoint behind
 * these routes re-checks the role server-side.
 */
export function RequireRole({ role, children }: RequireRoleProps) {
  const { t } = useTranslation();
  const { isAuthenticated, isLoading, hasRole } = useAuth();
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

  if (!hasRole(role)) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-8 w-8 text-state-reservado" aria-hidden />}
        title={t('roles.forbiddenTitle')}
        description={t('roles.forbiddenDetail', { rol: t(`roles.${role}`) })}
      />
    );
  }

  return <>{children}</>;
}
