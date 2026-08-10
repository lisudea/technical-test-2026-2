import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { AuthShell } from '../components/auth/AuthShell.jsx'
import { GoogleButton, googleEnabled } from '../components/auth/GoogleButton.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, Input } from '../components/ui/Form.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { messageFromError } from '../components/ui/Toast.jsx'
import { Icon } from '../components/ui/Icons.jsx'
import { validateLoginForm, INSTITUTIONAL_DOMAIN } from '../utils/validators.js'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.53 5.53 0 01-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.88-3c-1.07.72-2.45 1.15-4.05 1.15-3.11 0-5.74-2.1-6.68-4.93H1.29v3.1A12 12 0 0012 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.32 14.31a7.3 7.3 0 010-4.62v-3.1H1.29a12 12 0 000 10.82l4.03-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.76c1.76 0 3.34.6 4.58 1.79l3.44-3.44A11.96 11.96 0 0012 0 12 12 0 001.29 6.59l4.03 3.1C6.26 6.86 8.89 4.76 12 4.76z"
      />
    </svg>
  )
}

export default function LoginPage() {
  const { login, loginWithGoogle, isAuthenticated, busy } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const [values, setValues] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState(null)

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  const handleChange = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }))
    setErrors((errs) => ({ ...errs, [field]: undefined }))
    setFormError(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validateLoginForm(values)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setFormError(null)
    try {
      await login(values)
      navigate(from, { replace: true })
    } catch (err) {
      setFormError(messageFromError(err, 'Correo o contrasena incorrectos.'))
    }
  }

  const handleGoogleSuccess = async (credential) => {
    setFormError(null)
    if (!credential) {
      setFormError('No se recibio el token de Google. Intenta de nuevo.')
      return
    }
    try {
      await loginWithGoogle(credential)
      navigate(from, { replace: true })
    } catch (err) {
      setFormError(messageFromError(err))
    }
  }

  return (
    <AuthShell
      title="Iniciar sesion"
      subtitle={`Accede con tu cuenta institucional ${INSTITUTIONAL_DOMAIN}`}
      footer={
        <>
          <span className="text-muted">No tienes cuenta?</span>{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Registrate aqui
          </Link>
        </>
      }
    >
      {googleEnabled ? (
        <>
          <GoogleButton onSuccess={handleGoogleSuccess} onError={(err) => setFormError(err?.message)} disabled={busy} />
          <div className="my-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <span className="h-px flex-1 bg-line" />
            o continua con tu correo
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      ) : null}

      {formError ? (
        <Alert tone="error" className="mb-4" title="No se pudo iniciar sesion">
          {formError}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Field label="Correo institucional" required error={errors.email}>
          <Input
            type="email"
            autoComplete="username"
            placeholder="nombre@udea.edu.co"
            value={values.email}
            onChange={handleChange('email')}
            invalid={Boolean(errors.email)}
          />
        </Field>

        <Field label="Contrasena" required error={errors.password}>
          <Input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={values.password}
            onChange={handleChange('password')}
            invalid={Boolean(errors.password)}
          />
        </Field>

        <Button type="submit" className="w-full" loading={busy} icon="login">
          Iniciar sesion
        </Button>
      </form>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
        <Icon name="info" className="h-3.5 w-3.5" />
        Solo se permite el acceso con correos del dominio @udea.edu.co. Los equipos se prestan a
        la comunidad del laboratorio.
      </p>
    </AuthShell>
  )
}