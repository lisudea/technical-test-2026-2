import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { obtenerMascota } from '../mascota/mascota'
import MascotaLis from './MascotaLis'

interface Aviso {
  titulo: string
  texto: string
  glitch?: boolean
}

export default function ToastMascota() {
  const { t } = useTranslation()
  const { usuario } = useAuth()
  const [aviso, setAviso] = useState<Aviso | null>(null)

  const navigate = useNavigate()
  const { pathname } = useLocation()

  useEffect(() => {
    if (usuario && !obtenerMascota().llego && pathname !== '/perfil') {
      const temporizador = setTimeout(
        () => setAviso({ titulo: t('intruso.alerta'), texto: t('intruso.alertaTexto'), glitch: true }),
        2500,
      )
      return () => clearTimeout(temporizador)
    }
  }, [usuario, t, pathname])

  useEffect(() => {
    const alCompletar = (e: Event) => {
      const { mision, xp } = (e as CustomEvent).detail
      setAviso({ titulo: t('mascota.completada'), texto: `${t(`mascota.mision.${mision}`)} · +${xp} XP` })
    }
    window.addEventListener('lis-mision', alCompletar)
    return () => window.removeEventListener('lis-mision', alCompletar)
  }, [t])

  useEffect(() => {
    if (!aviso || aviso.glitch) return
    const temporizador = setTimeout(() => setAviso(null), 4500)
    return () => clearTimeout(temporizador)
  }, [aviso])

  if (!aviso) return null

  return (
    <div className="sheet-entrada fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      <button
        onClick={() => {
          setAviso(null)
          if (aviso.glitch) navigate('/perfil')
        }}
        className="flex w-full items-center gap-3 rounded-(--radius-card) bg-surface p-3 text-left"
        style={{
          boxShadow: aviso.glitch
            ? '0 8px 30px rgba(0,0,0,0.25), 0 0 0 1px #ff3b30'
            : '0 8px 30px rgba(0,0,0,0.25), 0 0 0 0.5px var(--separator)',
        }}
      >
        {aviso.glitch ? (
          <span className="glitch flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-bad/12 text-[20px] font-bold text-bad">
            !
          </span>
        ) : (
          <MascotaLis nivel={2} tamano={44} />
        )}
        <span className="min-w-0">
          <span className={`block text-[14px] font-semibold ${aviso.glitch ? 'glitch text-bad' : 'text-label'}`}>
            {aviso.titulo}
          </span>
          <span className="block truncate text-[13px] text-slabel">{aviso.texto}</span>
        </span>
      </button>
    </div>
  )
}
