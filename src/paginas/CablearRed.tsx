import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mascota as apiMascota } from '../api/servicios'
import { useAuth } from '../auth/AuthContext'
import TituloGrande from '../componentes/TituloGrande'
import Alerta from '../componentes/Alerta'
import { claseBoton } from '../componentes/TarjetaAuth'
import { IconoNodo } from '../componentes/ilustraciones'

const SIZE = 4
const UMBRAL_PISTA = 8
const N = 1
const E = 2
const S = 4
const W = 8
const DIRS = [N, E, S, W]
const DELTA: Record<number, [number, number]> = { [N]: [-1, 0], [E]: [0, 1], [S]: [1, 0], [W]: [0, -1] }

const girar = (m: number) => ((m << 1) | (m >> 3)) & 15
const opuesto = (d: number) => ((d << 2) | (d >> 2)) & 15
const grados = (m: number) => DIRS.filter((d) => m & d).length

type Tipo = 'router' | 'equipo' | 'cable'
interface Celda {
  base: number
  rot: number
  tipo: Tipo
}

function generar(): { celdas: Celda[]; desalineadas: number } {
  // Árbol de expansión (DFS aleatorio) desde el router: garantiza que siempre tiene solución.
  const masks = new Array(SIZE * SIZE).fill(0)
  const visto = new Array(SIZE * SIZE).fill(false)
  const idx = (r: number, c: number) => r * SIZE + c
  const pila = [0]
  visto[0] = true

  while (pila.length) {
    const actual = pila[pila.length - 1]
    const r = Math.floor(actual / SIZE)
    const c = actual % SIZE
    const opciones = DIRS.filter((d) => {
      const [dr, dc] = DELTA[d]
      const nr = r + dr
      const nc = c + dc
      return nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && !visto[idx(nr, nc)]
    })
    if (opciones.length === 0) {
      pila.pop()
      continue
    }
    const d = opciones[Math.floor(Math.random() * opciones.length)]
    const [dr, dc] = DELTA[d]
    const vecino = idx(r + dr, c + dc)
    masks[actual] |= d
    masks[vecino] |= opuesto(d)
    visto[vecino] = true
    pila.push(vecino)
  }

  let desalineadas = 0
  const celdas: Celda[] = masks.map((base, i) => {
    const rot = Math.floor(Math.random() * 4)
    if (rot !== 0) desalineadas++
    const tipo: Tipo = i === 0 ? 'router' : grados(base) === 1 ? 'equipo' : 'cable'
    return { base, rot, tipo }
  })
  return { celdas, desalineadas }
}

const maskDe = (celda: Celda) => {
  let m = celda.base
  for (let i = 0; i < celda.rot; i++) m = girar(m)
  return m
}

function calcularEnergia(celdas: Celda[]): boolean[] {
  const energia = new Array(SIZE * SIZE).fill(false)
  const cola = [0]
  energia[0] = true
  while (cola.length) {
    const actual = cola.shift() as number
    const r = Math.floor(actual / SIZE)
    const c = actual % SIZE
    const m = maskDe(celdas[actual])
    for (const d of DIRS) {
      if (!(m & d)) continue
      const [dr, dc] = DELTA[d]
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nr >= SIZE || nc < 0 || nc >= SIZE) continue
      const vecino = nr * SIZE + nc
      if (energia[vecino]) continue
      if (maskDe(celdas[vecino]) & opuesto(d)) {
        energia[vecino] = true
        cola.push(vecino)
      }
    }
  }
  return energia
}

// punto medio de cada lado en el lienzo 100x100
const LADO: Record<number, [number, number]> = { [N]: [50, 4], [E]: [96, 50], [S]: [50, 96], [W]: [4, 50] }

function Ficha({
  celda,
  encendida,
  resaltada,
  alGirar,
}: {
  celda: Celda
  encendida: boolean
  resaltada: boolean
  alGirar: () => void
}) {
  const { t } = useTranslation()
  const color = encendida ? 'var(--accent)' : 'var(--tlabel)'
  return (
    <button
      onClick={alGirar}
      aria-label={t('cablear.girar')}
      className={`relative aspect-square rounded-(--radius-control) bg-surface transicion-spring active:scale-95 ${resaltada ? 'animate-pulse' : ''}`}
      style={{ boxShadow: resaltada ? '0 0 0 2px var(--accent)' : '0 0 0 1px var(--separator)' }}
    >
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <g style={{ transformOrigin: 'center', transform: `rotate(${celda.rot * 90}deg)`, transition: 'transform 0.25s cubic-bezier(0.34,1.4,0.5,1)' }}>
          {DIRS.filter((d) => celda.base & d).map((d) => (
            <line key={d} x1={50} y1={50} x2={LADO[d][0]} y2={LADO[d][1]} stroke={color} strokeWidth={7} strokeLinecap="round" />
          ))}
        </g>
        {celda.tipo === 'cable' && <circle cx={50} cy={50} r={7} fill={color} />}
      </svg>
      {celda.tipo !== 'cable' && (
        <span
          className={`absolute inset-0 flex items-center justify-center transicion-spring ${encendida ? 'text-accent' : 'text-tlabel opacity-60'}`}
          aria-hidden
        >
          <IconoNodo tipo={celda.tipo === 'router' ? 'router' : 'equipo'} tamano={24} />
        </span>
      )}
    </button>
  )
}

export default function CablearRed() {
  const { t } = useTranslation()
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const [{ celdas, desalineadas }, setEstado] = useState(generar)
  const [giros, setGiros] = useState(0)
  const [pistas, setPistas] = useState(0)
  const [resaltada, setResaltada] = useState<number | null>(null)
  const [resultado, setResultado] = useState<{ xp: number; objeto: string | null } | null>(null)

  const energia = useMemo(() => calcularEnergia(celdas), [celdas])
  const ganado = useMemo(() => energia.every(Boolean), [energia])

  const enviar = useMutation({
    mutationFn: (puntos: number) => apiMascota.sumarXp(puntos),
    onSuccess: (data) => {
      setResultado({ xp: data.ganados, objeto: data.objetoGanado })
      queryClient.invalidateQueries({ queryKey: ['mascota'] })
    },
  })

  const girarFicha = (i: number) => {
    if (ganado) return
    setEstado((prev) => ({
      ...prev,
      celdas: prev.celdas.map((c, j) => (j === i ? { ...c, rot: (c.rot + 1) % 4 } : c)),
    }))
    setGiros((g) => g + 1)
  }

  // Pista educativa: tras varios giros sin resolver, deja una ficha mal puesta en su
  // orientación correcta y la resalta, para que el usuario vea cómo debe quedar y avance.
  const pista = () => {
    if (ganado) return
    const malas = celdas.map((c, i) => (maskDe(c) !== c.base ? i : -1)).filter((i) => i >= 0)
    if (malas.length === 0) return
    const i = malas[Math.floor(Math.random() * malas.length)]
    setEstado((prev) => ({ ...prev, celdas: prev.celdas.map((c, j) => (j === i ? { ...c, rot: 0 } : c)) }))
    setResaltada(i)
    setPistas((p) => p + 1)
    setTimeout(() => setResaltada(null), 2600)
  }

  useEffect(() => {
    if (ganado && !resultado && !enviar.isPending) {
      // menos giros extra = más XP; cada pista descuenta un poco
      const puntos = Math.max(10, 45 - Math.max(0, giros - desalineadas) * 3 - pistas * 8)
      enviar.mutate(puntos)
    }
  }, [ganado, resultado, enviar, giros, desalineadas, pistas])

  const reiniciar = () => {
    setEstado(generar())
    setGiros(0)
    setPistas(0)
    setResaltada(null)
    setResultado(null)
  }

  if (!usuario) return <Navigate to="/login" replace />

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Link to="/juegos" className="text-[14px] font-medium text-accent">
        ‹ {t('juegos.volver')}
      </Link>
      <TituloGrande titulo={t('cablear.titulo')} subtitulo={t('cablear.subtitulo')} />

      <div className="flex items-center justify-between rounded-(--radius-card) bg-surface px-4 py-3">
        <span className="text-[14px] text-slabel">
          {t('cablear.giros')}: <b className="text-label tabular-nums">{giros}</b>
        </span>
        <div className="flex items-center gap-4">
          {!ganado && !resultado && giros >= UMBRAL_PISTA && (
            <button onClick={pista} className="text-[14px] font-medium text-accent">
              {t('cablear.pista')}
            </button>
          )}
          <button onClick={reiniciar} className="text-[14px] font-medium text-accent">
            {t('cablear.reiniciar')}
          </button>
        </div>
      </div>

      {resultado && (
        <Alerta tipo="exito">
          {t('cablear.ganaste', { xp: resultado.xp })}
          {resultado.objeto ? ' ' + t('cablear.masObjeto', { objeto: t(`objetos.${resultado.objeto}`) }) : ''}
        </Alerta>
      )}

      <div className="grid grid-cols-4 gap-2.5">
        {celdas.map((celda, i) => (
          <Ficha key={i} celda={celda} encendida={energia[i]} resaltada={resaltada === i} alGirar={() => girarFicha(i)} />
        ))}
      </div>

      {resaltada !== null ? (
        <p className="text-center text-[13px] font-medium text-accent">{t('cablear.pistaAyuda')}</p>
      ) : (
        <p className="text-center text-[13px] text-slabel">{t('cablear.ayuda')}</p>
      )}

      {resultado && (
        <button onClick={reiniciar} className={claseBoton}>
          {t('cablear.otra')}
        </button>
      )}
    </div>
  )
}
