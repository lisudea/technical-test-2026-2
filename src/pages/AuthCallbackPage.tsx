import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'
import { useToast } from '../feedback/useToast'
import { useI18n } from '../i18n/useI18n'
import { LoadingRow } from '../components/common/Feedback'

/**
 * Punto de retorno del SSO de Google.
 *
 * Tras validar que el correo es @udea.edu.co, el backend emite un JWT y
 * redirige aqui con ?token=... Esta pagina lo guarda, carga el perfil desde
 * /api/auth/me y devuelve al usuario al tablero.
 *
 * El token se borra de la URL con `replace` para que no quede en el historial
 * del navegador ni se comparta sin querer al copiar el enlace.
 */
export function AuthCallbackPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { completeLogin } = useAuth()
  const toast = useToast()
  const { t } = useI18n()

  const [failed, setFailed] = useState(false)
  // React 18+ monta dos veces en modo estricto: evitamos procesar el token dos veces.
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const token = searchParams.get('token')

    if (!token) {
      setFailed(true)
      return
    }

    completeLogin(token)
      .then(() => {
        toast.showSuccess('auth.welcome', { name: '' })
        navigate('/', { replace: true })
      })
      .catch((error) => {
        toast.showError(error)
        setFailed(true)
      })
  }, [searchParams, completeLogin, navigate, toast])

  if (failed) {
    return (
      <div className="card" style={{ padding: 'var(--space-5)' }}>
        <div className="alert alert--error" role="alert">
          <div>
            <span className="alert__title">{t('errors.UNAUTHORIZED.title')}</span>
            <div>{t('auth.callbackError')}</div>
          </div>
        </div>

        <button
          type="button"
          className="btn btn--secondary mt-3"
          onClick={() => navigate('/', { replace: true })}
        >
          {t('nav.dashboard')}
        </button>
      </div>
    )
  }

  return <LoadingRow labelKey="auth.loggingIn" />
}