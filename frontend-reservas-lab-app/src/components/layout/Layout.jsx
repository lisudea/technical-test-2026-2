import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { Icon } from '../ui/Icons.jsx'
import { Role } from '../../models/enums.js'

const userNav = [{ to: '/', label: 'Inicio', icon: 'chart', end: true }]

const commonNav = [
  { to: '/equipos', label: 'Equipos', icon: 'device' },
  { to: '/reservas', label: 'Mis reservas', icon: 'calendar' },
]

const adminNav = [
  { to: '/admin/reservas', label: 'Reservas', icon: 'calendarPlus' },
  { to: '/admin/equipos', label: 'Equipos', icon: 'device' },
  { to: '/admin/usuarios', label: 'Usuarios', icon: 'users' },
  { to: '/admin/categorias', label: 'Categorias', icon: 'tag' },
]

function navLinkClass({ isActive }) {
  return `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-all ${
    isActive
      ? 'bg-primary-50 text-primary-dark'
      : 'text-muted hover:bg-gray-100 hover:text-primary-dark'
  }`
}

function Brand() {
  return (
    <NavLink to="/" className="flex items-center gap-2.5">
      <img src="/logo.svg" alt="Logo LIS" className="h-9 w-9" />
      <span className="leading-tight">
        <span className="block text-base font-bold text-primary-dark">RESERVAS EQUIPOS LIS</span>
        <span className="hidden text-[11px] text-muted lg:block">Laboratorio Integrado de Sistemas</span>
      </span>
    </NavLink>
  )
}

export function Layout() {
  const { user, isAuthenticated, logout, restoring } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const navigate = useNavigate()
  const menuRef = useRef(null)
  const location = useLocation()

  const isAdmin = user?.role === Role.ADMINISTRADOR

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login', { replace: true })
  }

  const navItems = isAuthenticated
    ? isAdmin
      ? [...userNav, ...commonNav.filter((item) => item.to !== '/equipos'), ...adminNav]
      : [...userNav, ...commonNav]
    : []

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
          <Brand />

          <nav className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.end ?? false}>
                <Icon name={item.icon} className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            {!isAuthenticated && !restoring ? (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 rounded-2xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-ink"
              >
                <Icon name="login" className="h-4 w-4" />
                Iniciar sesion
              </button>
            ) : null}

            {isAuthenticated ? (
              <div className="hidden items-center gap-3 lg:flex">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {(user?.name ?? 'U').charAt(0).toUpperCase()}
                  </span>
                  <span className="leading-tight">
                    <span className="block max-w-40 truncate text-sm font-semibold text-ink">
                      {user?.fullName}
                    </span>
                    <span className="block text-xs text-muted">{user?.email}</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-muted transition hover:bg-red-50 hover:text-red-600"
                >
                  <Icon name="logout" className="h-4 w-4" />
                  Salir
                </button>
              </div>
            ) : null}

            <button
              type="button"
              className="rounded-xl p-2 text-muted transition hover:bg-gray-100 lg:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Cerrar menu' : 'Abrir menu'}
              aria-expanded={menuOpen}
            >
              <Icon name={menuOpen ? 'close' : 'menu'} className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Menu movil */}
        {menuOpen ? (
          <div ref={menuRef} className="border-t border-line bg-white px-4 py-3 animate-fade-in lg:hidden">
            {isAuthenticated ? (
              <div className="mb-3 flex items-center gap-2.5 rounded-2xl bg-primary-50 px-3 py-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                  {(user?.name ?? 'U').charAt(0).toUpperCase()}
                </span>
                <span className="leading-tight">
                  <span className="block text-sm font-semibold text-ink">{user?.fullName}</span>
                  <span className="block truncate text-xs text-muted">{user?.email}</span>
                </span>
              </div>
            ) : null}

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => (
                <NavLink key={item.to} to={item.to} className={navLinkClass} end={item.end ?? false}>
                  <Icon name={item.icon} className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <Icon name="logout" className="h-4 w-4" />
                Cerrar sesion
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-primary bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white hover:text-ink"
              >
                <Icon name="login" className="h-4 w-4" />
                Iniciar sesion
              </button>
            )}
          </div>
        ) : null}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-line bg-white px-6 py-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 text-center">
        <img src="/favicon.svg" alt="LIS" className="h-10 w-10" />
        <p className="text-sm text-muted">
          Laboratorio Integrado de Sistemas · Universidad de Antioquia
        </p>
        <p className="max-w-xl text-xs text-gray-400">
          Plataforma de reservas de equipos de laboratorio. Acceso exclusivo para la comunidad
          institucional <span className="font-semibold">@udea.edu.co</span>.
        </p>
      </div>
    </footer>
  )
}