import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutGrid,
  CalendarClock,
  BarChart3,
  LogIn,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthContext';
import { UserMenu } from '@/features/auth/components/UserMenu';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SUPPORTED_LANGS, type AppLang } from '@/i18n/i18n';

const NAV = [
  { to: '/', key: 'nav.dashboard', icon: LayoutGrid, end: true },
  { to: '/mis-reservas', key: 'nav.myReservations', icon: CalendarClock, end: false },
  { to: '/estadisticas', key: 'nav.stats', icon: BarChart3, end: false },
];

export function Layout() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors duration-200',
      isActive
        ? 'bg-primary text-white shadow-sm'
        : 'text-ink-soft hover:bg-primary-50 hover:text-primary-dark'
    );

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-surface-line bg-surface-card/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
              <LayoutGrid className="h-5 w-5" aria-hidden />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-ink">{t('common.appName')}</p>
              <p className="hidden text-xs text-ink-muted sm:block">{t('common.tagline')}</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
            {NAV.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                <item.icon className="h-4 w-4" aria-hidden />
                <span>{t(item.key)}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher
              current={i18n.language as AppLang}
              options={SUPPORTED_LANGS}
            />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Link
                to="/login"
                className="hidden items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark sm:inline-flex"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                {t('nav.login')}
              </Link>
            )}
            <button
              type="button"
              className="rounded-lg p-2 text-ink-soft transition-colors hover:bg-surface-line/60 md:hidden"
              aria-label="Menú"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <nav className="border-t border-surface-line bg-surface-card px-4 py-3 md:hidden" aria-label="Móvil">
            <ul className="flex flex-col gap-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={() => setMobileOpen(false)}
                    className={navLinkClass}
                  >
                    <item.icon className="h-4 w-4" aria-hidden />
                    <span>{t(item.key)}</span>
                  </NavLink>
                </li>
              ))}
              {!isAuthenticated && (
                <li>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-primary-dark hover:bg-primary-50"
                  >
                    <LogIn className="h-4 w-4" aria-hidden />
                    {t('nav.login')}
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-4 sm:px-6">
        <p className="flex items-center justify-center gap-1.5 text-center text-xs text-ink-muted">
          <Globe className="h-3.5 w-3.5" aria-hidden />
          {t('common.appName')} · {t('common.tagline')}
        </p>
      </footer>
    </div>
  );
}
