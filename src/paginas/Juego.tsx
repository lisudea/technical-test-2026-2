import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mascota as apiMascota } from '../api/servicios'
import { useAuth } from '../auth/AuthContext'
import IconoCategoria from '../componentes/IconoCategoria'
import TituloGrande from '../componentes/TituloGrande'
import Alerta from '../componentes/Alerta'
import { claseBoton } from '../componentes/TarjetaAuth'

const BASE = ['MICROCONTROLADORES', 'VR', 'REDES', 'COMPUTO', 'IMPRESION_3D']
const EXTRA = ['ROBOTICA', 'SERVIDOR', 'SENSOR']

interface Carta {
  id: number
  simbolo: string
  volteada: boolean
  emparejada: boolean
}

function barajar(dificil: boolean): Carta[] {
  const simbolos = dificil ? [...BASE, ...EXTRA] : BASE
  const arr = [...simbolos, ...simbolos].map((simbolo, id) => ({ id, simbolo, volteada: false, emparejada: false }))
  // Fisher-Yates sobre la copia
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
  const [dificil, setDificil] = useState(false)
  const [cartas, setCartas] = useState<Carta[]>(() => barajar(false))
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
      // menos movimientos = más XP; el modo difícil da más tope
      const tope = dificil ? 60 : 45
      const par = dificil ? 8 : 5
      const puntos = Math.max(dificil ? 15 : 10, tope - Math.max(0, movimientos - par) * 3)
      enviar.mutate(puntos)
    }
  }, [ganado, resultado, enviar, movimientos, dificil])

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

  const reiniciar = (nivel = dificil) => {
    setCartas(barajar(nivel))
    setElegidas([])
    setMovimientos(0)
    setBloqueo(false)
    setResultado(null)
  }

  const cambiarNivel = (nivel: boolean) => {
    setDificil(nivel)
    reiniciar(nivel)
  }

  if (!usuario) return <Navigate to="/login" replace />

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Link to="/juegos" className="text-[14px] font-medium text-accent">‹ {t('juegos.volver')}</Link>
      <TituloGrande titulo={t('juego.titulo')} subtitulo={t('juego.subtitulo')} />

      <div className="flex items-center justify-between rounded-(--radius-card) bg-surface px-2 py-2">
        <div className="flex rounded-[10px] bg-fillc p-0.5 text-[13px] font-semibold">
          {[
            { v: false, k: 'normal' },
            { v: true, k: 'dificil' },
          ].map(({ v, k }) => (
            <button
              key={k}
              onClick={() => cambiarNivel(v)}
              className={`rounded-[8px] px-3 py-1.5 transicion-spring ${dificil === v ? 'bg-surface text-label shadow-sm' : 'text-slabel'}`}
            >
              {t(`juego.${k}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 pr-2">
          <span className="text-[14px] text-slabel">{t('juego.movimientos')}: <b className="text-label tabular-nums">{movimientos}</b></span>
          <button onClick={() => reiniciar()} className="text-[14px] font-medium text-accent">{t('juego.reiniciar')}</button>
        </div>
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
        <button onClick={() => reiniciar()} className={claseBoton}>{t('juego.otra')}</button>
      )}
    </div>
  )
}
