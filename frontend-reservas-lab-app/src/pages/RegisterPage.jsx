import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { AuthShell } from '../components/auth/AuthShell.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, Input } from '../components/ui/Form.jsx'
import { Alert } from '../components/ui/Alert.jsx'
import { messageFromError } from '../components/ui/Toast.jsx'
import { Icon } from '../components/ui/Icons.jsx'
import { validateRegisterForm, normalizeEmail } from '../utils/validators.js'

export default function RegisterPage() {
  const { register, isAuthenticated, busy } = useAuth()
  const navigate = useNavigate()

  const [values, setValues] = useState({ name: '', lastName: '', email: '', password: '' })
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
    const validation = validateRegisterForm(values)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    setFormError(null)
    try {
      await register({
        name: values.name.trim(),
        lastName: values.lastName.trim(),
        email: normalizeEmail(values.email),
        password: values.password,
      })
      navigate('/', { replace: true })
    } catch (err) {
      setFormError(messageFromError(err, 'No fue posible crear la cuenta.'))
    }
  }

  return (
    <AuthShell
      title="Crear cuenta"
      subtitle="Registrate con tu correo institucional de la Universidad de Antioquia"
      footer={
        <>
          <span className="text-muted">Ya tienes cuenta?</span>{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Inicia sesion
          </Link>
        </>
      }
    >
      {formError ? (
        <Alert tone="error" className="mb-4" title="No se pudo registrar">
          {formError}
        </Alert>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre" required error={errors.name}>
            <Input
              placeholder="Ana"
              value={values.name}
              onChange={handleChange('name')}
              invalid={Boolean(errors.name)}
              autoComplete="given-name"
            />
          </Field>

          <Field label="Apellido" required error={errors.lastName}>
            <Input
              placeholder="Lopez"
              value={values.lastName}
              onChange={handleChange('lastName')}
              invalid={Boolean(errors.lastName)}
              autoComplete="family-name"
            />
          </Field>
        </div>

        <Field
          label="Correo institucional"
          required
          error={errors.email}
          hint="Debe pertenecer al dominio @udea.edu.co para poder reservar equipos."
        >
          <Input
            type="email"
            placeholder="nombre@udea.edu.co"
            value={values.email}
            onChange={handleChange('email')}
            invalid={Boolean(errors.email)}
            autoComplete="username"
          />
        </Field>

        <div className="relative">
          <Field label="Contrasena" required error={errors.password} hint="Minimo 6 caracteres.">
            <Input
              type="password"
              placeholder="••••••••"
              value={values.password}
              onChange={handleChange('password')}
              invalid={Boolean(errors.password)}
              autoComplete="new-password"
              className="pr-10"
            />
          </Field>
          <Icon
            name="key"
            className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 text-gray-400"
          />
        </div>

        <Button type="submit" className="w-full" loading={busy} icon="sparkles">
          Registrarme
        </Button>
      </form>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400">
        <Icon name="shield" className="h-3.5 w-3.5" />
        Al registrarte aceptas las normas de uso de los equipos del laboratorio.
      </p>
    </AuthShell>
  )
}