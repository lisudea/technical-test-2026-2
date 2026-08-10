import { GoogleLogin } from '@react-oauth/google'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

/**
 * Boton "Continuar con Google". Envia el idToken (credential) que otorga
 * Google hacia /api/auth/google; el backend valida firma/audiencia y solo
 * permite accesos con dominio @udea.edu.co.
 */
export function GoogleButton({ onSuccess, onError, disabled, className = '' }) {
  if (!GOOGLE_CLIENT_ID) {
    return null
  }

  return (
    <GoogleLogin
      onSuccess={(response) => onSuccess?.(response?.credential)}
      onError={() => onError?.(new Error('No fue posible iniciar sesion con Google.'))}
      useOneTap={false}
      shape="pill"
      text="continue_with"
      theme="outline"
      width="100%"
      containerProps={{ className: `w-full [&>div]:w-full ${className}` }}
      disabled={disabled}
    />
  )
}

export const googleEnabled = Boolean(GOOGLE_CLIENT_ID)