import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import LanguageToggle from './LanguageToggle'
import MobileDrawer from './MobileDrawer'

// El componente Navbar representa la barra de navegación principal de la aplicación.
// Utiliza el hook useLanguage para acceder al contexto de idioma y obtener las traducciones
//  correspondientes a las claves de texto en el idioma seleccionado. Renderiza enlaces de
//  navegación a las páginas de equipos y reservas, un componente LanguageToggle para cambiar
//  el idioma, y un botón de menú desplegable para dispositivos móviles que abre el componente
//  MobileDrawer.
export default function Navbar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const { t } = useLanguage()

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'navbar__link navbar__link--active' : 'navbar__link'

  return (
    <header className="navbar">
      <div className="navbar__inner">
        <Link className="brand" to="/">
          <img
            className="brand__logo"
            src="/lis-logo.png"
            alt="Laboratorio Integrado de Sistemas"
            width={40}
            height={40}
          />
          <span className="brand__text">{t('nav.brand')}</span>
        </Link>
        <nav className="navbar__nav" aria-label={t('nav.brand')}>
          <NavLink to="/" end className={linkClass}>
            {t('nav.equipos')}
          </NavLink>
          <NavLink to="/reservas" className={linkClass}>
            {t('nav.reservas')}
          </NavLink>
        </nav>
        <div className="navbar__actions">
          <LanguageToggle />
          <button
            type="button"
            className="hamburger"
            aria-label={t('nav.openMenu')}
            aria-expanded={drawerOpen}
            onClick={() => setDrawerOpen(true)}
          >
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
            <span className="hamburger__bar" />
          </button>
        </div>
      </div>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  )
}
