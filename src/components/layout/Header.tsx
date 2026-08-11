import { NavLink } from 'react-router-dom'

import { useI18n } from '../../i18n/useI18n'
import { AuthButton } from './AuthButton'
import { LanguageSwitcher } from './LanguageSwitcher'
import type { TranslationKey } from '../../i18n/types'

const LINKS: { to: string; labelKey: TranslationKey }[] = [
  { to: '/', labelKey: 'nav.dashboard' },
  { to: '/reservas', labelKey: 'nav.reservations' },
  { to: '/equipos', labelKey: 'nav.equipment' },
  { to: '/estadisticas', labelKey: 'nav.statistics' },
]

export function Header() {
  const { t } = useI18n()

  return (
    <header className="header">
      <div className="container header__inner">
        <div className="header__top">
          <div className="header__brand">
            <span className="header__logo" aria-hidden="true">
              LIS
            </span>

            <div className="header__titles">
              <h1 className="header__title">{t('app.title')}</h1>
              <p className="header__subtitle">{t('app.subtitle')}</p>
            </div>
          </div>

          <div className="header__actions">
            <LanguageSwitcher />
            <AuthButton />
          </div>
        </div>

        <nav className="nav" aria-label={t('nav.menu')}>
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`}
            >
              {t(link.labelKey)}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}