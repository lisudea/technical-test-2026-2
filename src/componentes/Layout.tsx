import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { TituloProvider, useTituloBarra } from './TituloContext'
import { aplicarTema, obtenerTema, siguienteTema, type Tema } from '../tema'
import ToastMascota from './ToastMascota'
import { registrarEvento } from '../mascota/mascota'

function IconoTablero({ activo }: { activo: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" fill={activo ? 'currentColor' : 'none'} />
      <rect x="13.5" y="3.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" fill={activo ? 'currentColor' : 'none'} />
      <rect x="3.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" fill={activo ? 'currentColor' : 'none'} />
      <rect x="13.5" y="13.5" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.7" fill={activo ? 'currentColor' : 'none'} />
    </svg>
  )
}

function IconoReservas({ activo }: { activo: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3.5" y="5" width="17" height="15.5" rx="3" stroke="currentColor" strokeWidth="1.7" fill={activo ? 'currentColor' : 'none'} />
      <path d="M3.5 9.5h17" stroke={activo ? 'var(--surface)' : 'currentColor'} strokeWidth="1.7" />
      <path d="M8 3v3M16 3v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function IconoPersona({ activo }: { activo: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.7" fill={activo ? 'currentColor' : 'none'} />
      <path d="M4.5 20.5c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function IconoTema({ tema }: { tema: Tema }) {
  if (tema === 'claro')
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="4.2" fill="currentColor" />
        <path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5 5l1.8 1.8M17.2 17.2L19 19M19 5l-1.8 1.8M6.8 17.2L5 19" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  if (tema === 'oscuro')
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" fill="currentColor" />
      </svg>
    )
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3.8a8.2 8.2 0 0 1 0 16.4z" fill="currentColor" />
    </svg>
  )
}

function BotonTema() {
  const [tema, setTema] = useState<Tema>(obtenerTema)

  const cambiar = () => {
    const nuevo = siguienteTema(tema)
    setTema(nuevo)
    aplicarTema(nuevo)
    if (nuevo === 'oscuro') registrarEvento({ tipo: 'tema-oscuro' })
  }

  return (
    <button
      onClick={cambiar}
      aria-label={`tema: ${tema}`}
      title={tema}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-fillc text-slabel transicion-spring hover:text-label"
    >
      <IconoTema tema={tema} />
    </button>
  )
}

function SelectorIdioma() {
  const { i18n } = useTranslation()
  return (
    <div className="flex rounded-[9px] bg-fillc p-0.5 text-[13px] font-semibold">
      {(['es', 'en'] as const).map((idioma) => (
        <button
          key={idioma}
          onClick={() => {
            i18n.changeLanguage(idioma)
            registrarEvento({ tipo: 'idioma' })
          }}
          className={`rounded-[7px] px-2.5 py-1 uppercase transicion-spring ${
            i18n.language === idioma ? 'bg-surface text-label shadow-sm' : 'text-slabel'
          }`}
        >
          {idioma}
        </button>
      ))}
    </div>
  )
}

function Contenido() {
  const { t } = useTranslation()
  const { usuario } = useAuth()
  const { titulo } = useTituloBarra()

  const enlaceEscritorio = ({ isActive }: { isActive: boolean }) =>
    `text-[15px] font-medium transicion-spring ${isActive ? 'text-label' : 'text-slabel hover:text-label'}`

  const pestana = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 pt-2 pb-1 text-[10px] font-medium ${
      isActive ? 'text-accent' : 'text-slabel'
    }`

  return (
    <div className="min-h-screen bg-bg">
      <header className="barra-translucida sticky top-0 z-40" style={{ boxShadow: '0 0.5px 0 var(--separator)' }}>
        <div className="mx-auto flex h-[52px] max-w-5xl items-center gap-3 px-4 sm:gap-5">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span className="text-[17px] font-semibold text-label">LIS</span>
          </Link>
          <nav className="hidden gap-5 sm:flex">
            <NavLink to="/tablero" className={enlaceEscritorio}>
              {t('app.nav.dashboard')}
            </NavLink>
            <NavLink to="/reservas" className={enlaceEscritorio}>
              {t('app.nav.reservas')}
            </NavLink>
            {usuario?.rol === 'ADMIN' && (
              <NavLink to="/admin" className={enlaceEscritorio}>
                {t('app.nav.admin')}
              </NavLink>
            )}
          </nav>
          <span
            className={`pointer-events-none absolute left-1/2 hidden -translate-x-1/2 text-[17px] font-semibold text-label transicion-spring sm:block ${
              titulo ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {titulo}
          </span>
          <div className="ml-auto flex items-center gap-2 sm:gap-2.5">
            <SelectorIdioma />
            <BotonTema />
            {usuario ? (
              <Link
                to="/perfil"
                aria-label={t('perfil.titulo')}
                className="hidden h-8 w-8 items-center justify-center rounded-full bg-accent text-[12px] font-bold text-white sm:flex"
              >
                {usuario.nombre.trim().charAt(0).toUpperCase()}
              </Link>
            ) : (
              <Link to="/login" className="hidden text-[15px] font-medium text-accent sm:block">
                {t('app.nav.entrar')}
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:pb-12">
        <Outlet />
      </main>

      <ToastMascota />

      <nav
        className="barra-translucida fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 pb-[env(safe-area-inset-bottom)] sm:hidden"
        style={{ boxShadow: '0 -0.5px 0 var(--separator)' }}
      >
        <NavLink to="/tablero" className={pestana}>
          {({ isActive }) => (
            <>
              <IconoTablero activo={isActive} />
              {t('app.nav.dashboard')}
            </>
          )}
        </NavLink>
        <NavLink to="/reservas" className={pestana}>
          {({ isActive }) => (
            <>
              <IconoReservas activo={isActive} />
              {t('app.nav.reservas')}
            </>
          )}
        </NavLink>
        <NavLink to={usuario ? '/perfil' : '/login'} className={pestana}>
          {({ isActive }) => (
            <>
              <IconoPersona activo={isActive} />
              {usuario ? usuario.nombre.split(' ')[0] : t('app.nav.entrar')}
            </>
          )}
        </NavLink>
      </nav>
    </div>
  )
}

export default function Layout() {
  return (
    <TituloProvider>
      <Contenido />
    </TituloProvider>
  )
}
