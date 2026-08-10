import { useEffect } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import * as Sentry from '@sentry/react'
import { useAuth } from '../auth/AuthContext'
import TituloGrande from '../componentes/TituloGrande'
import { ArteJuego } from '../componentes/ilustraciones'

const JUEGOS = [
  { a: '/juegos/memoria', arte: 'memoria', titulo: 'juego.titulo', subtitulo: 'juego.subtitulo' },
  { a: '/juegos/red', arte: 'red', titulo: 'cablear.titulo', subtitulo: 'cablear.subtitulo' },
  { a: '/juegos/carrera', arte: 'carrera', titulo: 'carrera.titulo', subtitulo: 'carrera.subtitulo' },
]

export default function JuegosHub() {
  const { t } = useTranslation()
  const { usuario } = useAuth()

  useEffect(() => {
    // aviso a Sentry cuando alguien entra a Juegos (útil para ver qué hacen al revisar el repo)
    Sentry.captureMessage('Visita a Juegos', 'info')
  }, [])

  if (!usuario) return <Navigate to="/login" replace />

  return (
    <div className="mx-auto max-w-md space-y-5">
      <TituloGrande titulo={t('juegos.titulo')} subtitulo={t('juegos.subtitulo')} />
      <div className="grid gap-3">
        {JUEGOS.map((j) => (
          <Link
            key={j.a}
            to={j.a}
            className="flex items-center gap-4 rounded-(--radius-card) bg-surface p-3 transicion-spring hover:scale-[1.01] active:scale-[0.99]"
          >
            <ArteJuego juego={j.arte} className="h-16 w-16 shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block text-[16px] font-semibold text-label">{t(j.titulo)}</span>
              <span className="block text-[13px] text-slabel">{t(j.subtitulo)}</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-tlabel">
              <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  )
}
