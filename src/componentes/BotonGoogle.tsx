import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { auth } from '../api/servicios'
import { useAuth } from '../auth/AuthContext'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (elemento: HTMLElement, opciones: object) => void
        }
      }
    }
  }
}

export default function BotonGoogle({ alFallar }: { alFallar: (mensaje: string) => void }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const { iniciarSesion } = useAuth()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  useEffect(() => {
    if (!CLIENT_ID || !contenedor.current) return

    const montar = () => {
      window.google?.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (respuesta: { credential: string }) => {
          try {
            iniciarSesion(await auth.google(respuesta.credential))
            navigate('/')
          } catch (e) {
            alFallar(e instanceof Error ? e.message : t('comun.errorRed'))
          }
        },
      })
      window.google?.accounts.id.renderButton(contenedor.current!, {
        theme: 'outline',
        size: 'large',
        width: 320,
        locale: i18n.language,
      })
    }

    if (window.google) {
      montar()
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = montar
    document.head.appendChild(script)
  }, [iniciarSesion, navigate, alFallar, t, i18n.language])

  if (!CLIENT_ID) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-[12px] text-slabel">
        <span className="h-px flex-1 bg-separator" />
        {t('auth.oGoogle')}
        <span className="h-px flex-1 bg-separator" />
      </div>
      <div ref={contenedor} className="flex justify-center" />
    </div>
  )
}
