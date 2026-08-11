import { useAuth } from '../../auth/useAuth'
import { useI18n } from '../../i18n/useI18n'
import { Spinner } from '../common/Feedback'

/**
 * Entrada y salida de sesion (bonus del Reto 2 integrado en la interfaz).
 *
 * Al pulsar, el navegador va a /oauth2/authorization/google; el backend valida
 * que el correo sea @udea.edu.co, emite un JWT y redirige de vuelta a
 * /auth/callback?token=... , donde AuthCallbackPage lo recoge.
 */
export function AuthButton() {
  const { user, loading, login, logout } = useAuth()
  const { t } = useI18n()

  if (loading) {
    return (
      <span className="user-chip">
        <Spinner />
      </span>
    )
  }

  if (user) {
    return (
      <div className="header__actions">
        <span className="user-chip" title={user.email}>
          <span aria-hidden="true">👤</span>
          <span className="user-chip__name">{user.name || user.email}</span>
        </span>

        <button type="button" className="btn btn--ghost btn--sm" onClick={logout}>
          {t('auth.logout')}
        </button>
      </div>
    )
  }

  return (
    <button
      type="button"
      className="btn btn--secondary btn--sm"
      onClick={login}
      title={t('auth.institutionalOnly')}
    >
      <span aria-hidden="true">🔐</span>
      {t('auth.loginShort')}
    </button>
  )
}