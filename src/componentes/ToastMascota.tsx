import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { marcarLlegada, nivelActual, obtenerMascota } from '../mascota/mascota'
import MascotaLis from './MascotaLis'

interface Aviso {
  titulo: string
  texto: string
}

export default function ToastMascota() {
  const { t } = useTranslation()
  const { usuario } = useAuth()
  const [aviso, setAviso] = useState<Aviso | null>(null)

  useEffect(() => {
    if (usuario && marcarLlegada()) {
      setAviso({ titulo: t('mascota.llego'), texto: t('mascota.llegoTexto') })
    }
  }, [usuario, t])

  useEffect(() => {
    const alCompletar = (e: Event) => {
      const { mision, xp } = (e as CustomEvent).detail
      setAviso({ titulo: t('mascota.completada'), texto: `${t(`mascota.mision.${mision}`)} · +${xp} XP` })
    }
    window.addEventListener('lis-mision', alCompletar)
    return () => window.removeEventListener('lis-mision', alCompletar)
  }, [t])

  useEffect(() => {
    if (!aviso) return
    const temporizador = setTimeout(() => setAviso(null), 4500)
    return () => clearTimeout(temporizador)
  }, [aviso])

  if (!aviso) return null

  return (
    <div className="sheet-entrada fixed bottom-20 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0">
      <button
        onClick={() => setAviso(null)}
        className="flex w-full items-center gap-3 rounded-(--radius-card) bg-surface p-3 text-left"
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.25), 0 0 0 0.5px var(--separator)' }}
      >
        <MascotaLis nivel={nivelActual(obtenerMascota().xp)} tamano={44} />
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold text-label">{aviso.titulo}</span>
          <span className="block truncate text-[13px] text-slabel">{aviso.texto}</span>
        </span>
      </button>
    </div>
  )
}
