import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { BarChart3, Ban, Boxes, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { to: '/admin', end: true, key: 'admin.tabs.resumen', icon: BarChart3 },
  { to: '/admin/equipos', end: false, key: 'admin.tabs.equipos', icon: Boxes },
  { to: '/admin/usuarios', end: false, key: 'admin.tabs.usuarios', icon: Users },
  { to: '/admin/sanciones', end: false, key: 'admin.tabs.sanciones', icon: Ban },
];

/**
 * Sub-navigation for the admin console.
 *
 * <p>Each tab is a real route rather than local state, so a section can be
 * linked, bookmarked and reached with the browser's back button — which is
 * how people actually navigate a console they use every day.
 */
export function AdminTabs() {
  const { t } = useTranslation();

  return (
    <nav
      className="flex gap-1 overflow-x-auto rounded-xl border border-surface-line bg-surface-card p-1.5"
      aria-label={t('admin.title')}
    >
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            cn(
              'flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-ink-soft hover:bg-primary-50 hover:text-primary-dark'
            )
          }
        >
          <tab.icon className="h-4 w-4" aria-hidden />
          {t(tab.key)}
        </NavLink>
      ))}
    </nav>
  );
}
