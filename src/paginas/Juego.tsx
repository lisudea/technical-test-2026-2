import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mascota as apiMascota } from '../api/servicios'
import { useAuth } from '../auth/AuthContext'
import IconoCategoria from '../componentes/IconoCategoria'
import TituloGrande from '../componentes/TituloGrande'
import Alerta from '../componentes/Alerta'
import { claseBoton } from '../componentes/TarjetaAuth'

const SIMBOLOS = ['MICROCONTROLADORES', 'VR', 'REDES', 'COMPUTO', 'IMPRESION_3D', 'MICROCONTROLADORES', 'VR', 'REDES', 'COMPUTO', 'IMPRESION_3D']

interface Carta {
  id: number
  simbolo: string
  volteada: boolean
  emparejada: boolean
}

function barajar(): Carta[] {
  // Fisher-Yates sobre una copia
  const arr = SIMBOLOS.map((simbolo, id) => ({ id, simbolo, volteada: false, emparejada: false }))
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export default function Juego() {
  const { t } = useTranslation()
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const [cartas, setCartas] = useState<Carta[]>(barajar)
  const [elegidas, setElegidas] = useState<number[]>([])
  const [movimientos, setMovimientos] = useState(0)
  const [bloqueo, setBloqueo] = useState(false)
  const [resultado, setResultado] = useState<{ xp: number; objeto: string | null } | null>(null)

  const ganado = useMemo(() => cartas.every((c) => c.emparejada), [cartas])

  const enviar = useMutation({
    mutationFn: (puntos: number) => apiMascota.sumarXp(puntos),
    onSuccess: (data) => {
      setResultado({ xp: data.ganados, objeto: data.objetoGanado })
      queryClient.invalidateQueries({ queryKey: ['mascota'] })
    },
  })

  useEffect(() => {
    if (ganado && !resultado && !enviar.isPending) {
      // menos movimientos = más XP (mínimo 10, máximo ~40)
      const puntos = Math.max(10, 45 - Math.max(0, movimientos - 5) * 3)
      enviar.mutate(puntos)
    }
  }, [ganado, resultado, enviar, movimientos])

  const voltear = (idx: number) => {
    if (bloqueo || cartas[idx].volteada || cartas[idx].emparejada) return
    const nuevas = cartas.map((c, i) => (i === idx ? { ...c, volteada: true } : c))
    const abiertas = [...elegidas, idx]
    setCartas(nuevas)
    setElegidas(abiertas)

    if (abiertas.length === 2) {
      setMovimientos((m) => m + 1)
      setBloqueo(true)
      const [a, b] = abiertas
      if (nuevas[a].simbolo === nuevas[b].simbolo) {
        setCartas((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, emparejada: true } : c)))
        setElegidas([])
        setBloqueo(false)
      } else {
        setTimeout(() => {
          setCartas((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, volteada: false } : c)))
          setElegidas([])
          setBloqueo(false)
        }, 800)
      }
    }
  }

  const reiniciar = () => {
    setCartas(barajar())
    setElegidas([])
    setMovimientos(0)
    setBloqueo(false)
    setResultado(null)
  }

  if (!usuario) return <Navigate to="/login" replace />

  return (
    <div className="mx-auto max-w-md space-y-5">
      <TituloGrande titulo={t('juego.titulo')} subtitulo={t('juego.subtitulo')} />

      <div className="flex items-center justify-between rounded-(--radius-card) bg-surface px-4 py-3">
        <span className="text-[14px] text-slabel">{t('juego.movimientos')}: <b className="text-label tabular-nums">{movimientos}</b></span>
        <button onClick={reiniciar} className="text-[14px] font-medium text-accent">{t('juego.reiniciar')}</button>
      </div>

      {resultado && (
        <Alerta tipo="exito">
          {t('juego.ganaste', { xp: resultado.xp })}
          {resultado.objeto ? ' ' + t('juego.masObjeto', { objeto: t(`objetos.${resultado.objeto}`) }) : ''}
        </Alerta>
      )}

      <div className="grid grid-cols-4 gap-2.5">
        {cartas.map((carta, idx) => (
          <button
            key={carta.id}
            onClick={() => voltear(idx)}
            aria-label={carta.volteada || carta.emparejada ? t(`categorias.${carta.simbolo}`) : t('juego.carta')}
            className={`flex aspect-square items-center justify-center rounded-(--radius-control) transicion-spring ${
              carta.volteada || carta.emparejada ? 'bg-surface' : 'bg-accent active:scale-95'
            } ${carta.emparejada ? 'opacity-45' : ''}`}
            style={{ boxShadow: '0 0 0 1px var(--separator)' }}
          >
            {(carta.volteada || carta.emparejada) ? (
              <span className="text-accent"><IconoCategoria categoria={carta.simbolo} tamano={30} /></span>
            ) : (
              <span className="text-[20px] font-bold text-white/70">?</span>
            )}
          </button>
        ))}
      </div>

      {resultado && (
        <button onClick={reiniciar} className={claseBoton}>{t('juego.otra')}</button>
      )}
    </div>
  )
}
