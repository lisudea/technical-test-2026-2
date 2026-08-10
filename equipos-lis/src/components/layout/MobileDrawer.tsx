import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import { useLanguage } from '../../i18n/LanguageContext'
import LanguageToggle from './LanguageToggle'
// El componente MobileDrawer representa un menú lateral desplegable para dispositivos móviles.
// Utiliza un elemento <dialog> para mostrar el contenido del menú y permite a los usuarios navegar
//  entre las páginas de equipos y reservas. También incluye un botón para cerrar el menú y un
//  componente LanguageToggle para cambiar el idioma de la aplicación. El estado de apertura del
//  menú se controla mediante la propiedad open, y se proporciona una función onClose para cerrar
//  el menú cuando sea necesario.
interface MobileDrawerProps {
  open: boolean
  onClose: () => void
}

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const { t } = useLanguage()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? 'drawer__link drawer__link--active' : 'drawer__link'

  return (
    <dialog
      ref={ref}
      className="drawer"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose()
      }}
    >
      <div className="drawer__inner">
        <div className="drawer__head">
          <span className="drawer__brand">
            <img
              className="drawer__brand-logo"
              src="/lis-logo.png"
              alt=""
              width={36}
              height={36}
            />
            {t('nav.brand')}
          </span>
          <button
            type="button"
            className="drawer__close"
            onClick={onClose}
            aria-label={t('nav.close')}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
              <path
                d="M2 2l12 12M14 2L2 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        <nav className="drawer__links" aria-label={t('nav.brand')}>
          <NavLink to="/" end className={linkClass} onClick={onClose}>
            {t('nav.equipos')}
          </NavLink>
          <NavLink to="/reservas" className={linkClass} onClick={onClose}>
            {t('nav.reservas')}
          </NavLink>
        </nav>
        <div className="drawer__foot">
          <LanguageToggle />
        </div>
      </div>
    </dialog>
  )
}
