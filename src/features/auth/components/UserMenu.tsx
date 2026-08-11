import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

export function UserMenu() {
  const { t } = useTranslation();
  const { perfil, logout, isStaff } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const initial = perfil?.nombre?.trim().charAt(0).toUpperCase() ?? '?';

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('user.menu')}
        className="flex items-center gap-2 rounded-xl border border-surface-line bg-surface-card py-1.5 pl-1.5 pr-2.5 text-sm font-medium text-ink transition-colors hover:border-primary/50"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
          {initial}
        </span>
        <span className="hidden max-w-[10rem] truncate sm:inline">{perfil?.nombre}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-surface-line bg-surface-card p-1.5 shadow-soft animate-fade-in"
        >
          <div className="border-b border-surface-line px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-ink">
              <User className="h-3.5 w-3.5 text-primary" aria-hidden />
              {perfil?.nombre}
            </p>
            <p className="mt-0.5 truncate text-xs text-ink-muted">{perfil?.correo}</p>
            {/* Staff see which hat they are wearing: an auxiliar and an admin
                get different menus, and knowing which one is active avoids
                hunting for a section that is not there. */}
            {isStaff && perfil?.rol && (
              <span className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-primary-50 px-1.5 py-0.5 text-xs font-semibold text-primary-dark">
                <ShieldCheck className="h-3 w-3" aria-hidden />
                {t(`roles.${perfil.rol}`)}
              </span>
            )}
          </div>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/mis-reservas');
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-ink-soft transition-colors hover:bg-surface"
          >
            {t('nav.myReservations')}
          </button>
          <button
            role="menuitem"
            type="button"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-state-reservado transition-colors hover:bg-state-reservado/5"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t('nav.logout')}
          </button>
        </div>
      )}
    </div>
  );
}
