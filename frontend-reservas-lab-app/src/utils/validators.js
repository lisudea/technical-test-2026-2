/** Dominio que el backend exige para registros y accesos (AuthService). */
export const INSTITUTIONAL_DOMAIN = '@udea.edu.co'

export function normalizeEmail(email) {
  return (email ?? '').trim().toLowerCase()
}

export function isValidInstitutionalEmail(email) {
  const normalized = normalizeEmail(email)
  return normalized.endsWith(INSTITUTIONAL_DOMAIN) && normalized.length > INSTITUTIONAL_DOMAIN.length
}

/** Valida el formulario de registro del lado del cliente (espejo del backend). */
export function validateRegisterForm(values) {
  const errors = {}

  if (!values.name?.trim()) {
    errors.name = 'El nombre es obligatorio'
  }

  if (!values.lastName?.trim()) {
    errors.lastName = 'El apellido es obligatorio'
  }

  const email = normalizeEmail(values.email)
  if (!email) {
    errors.email = 'El correo es obligatorio'
  } else if (!/^\S+@\S+\.\S+$/.test(email)) {
    errors.email = 'El correo no tiene un formato valido'
  } else if (!isValidInstitutionalEmail(email)) {
    errors.email = `El correo debe pertenecer al dominio institucional ${INSTITUTIONAL_DOMAIN}`
  }

  if (!values.password) {
    errors.password = 'La contrasena es obligatoria'
  } else if (values.password.length < 6) {
    errors.password = 'La contrasena debe tener al menos 6 caracteres'
  }

  return errors
}

export function validateLoginForm(values) {
  const errors = {}
  if (!values.email?.trim()) {
    errors.email = 'El correo es obligatorio'
  } else if (!/^\S+@\S+\.\S+$/.test(values.email)) {
    errors.email = 'El correo no tiene un formato valido'
  }
  if (!values.password) {
    errors.password = 'La contrasena es obligatoria'
  }
  return errors
}

/** Extrae un email de un perfil de Google (payload del idToken). */
export function googleEmail(payload) {
  return payload?.email ?? ''
}