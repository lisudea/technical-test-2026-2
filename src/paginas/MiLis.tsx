import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { mascota as apiMascota } from '../api/servicios'
import { useAuth } from '../auth/AuthContext'
import { CATALOGO, alternarEquipado, porClave, type Rareza } from '../mascota/objetos'
import { nivelActual } from '../mascota/mascota'
import MascotaLis from '../componentes/MascotaLis'
import TituloGrande from '../componentes/TituloGrande'
import Alerta from '../componentes/Alerta'
import { claseCampo } from '../componentes/TarjetaAuth'
import { ArteJuego, Candado, Regalo } from '../componentes/ilustraciones'

const XP_NIVEL = [0, 50, 140]

const colorRareza: Record<Rareza, string> = {
  comun: 'text-slabel',
  raro: 'text-accent',
  especial: 'text-warn',
}

export default function MiLis() {
  const { t } = useTranslation()
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState('')
  const [aviso, setAviso] = useState('')
  const [abriendo, setAbriendo] = useState(false)

  const consulta = useQuery({
    queryKey: ['mascota'],
    queryFn: apiMascota.obtener,
    enabled: !!usuario,
  })

  const guardar = useMutation({
    mutationFn: (datos: { nombre?: string; equipados?: string[] }) => apiMascota.actualizar(datos),
    onSuccess: (data) => queryClient.setQueryData(['mascota'], data),
  })

  const regalo = useMutation({
    mutationFn: apiMascota.abrirRegalo,
    onSuccess: (data) => {
      if (data.objetoGanado) setAviso(t('lis.regaloRecibido', { objeto: t(`objetos.${data.objetoGanado}`) }))
      queryClient.invalidateQueries({ queryKey: ['mascota'] })
      setAbriendo(false)
    },
  })

  if (!usuario) return <Navigate to="/login" replace />
  if (consulta.isError) {
    return (
      <div className="mx-auto max-w-md">
        <Alerta tipo="error">
          {t('comun.errorRed')}{' '}
          <button onClick={() => consulta.refetch()} className="font-semibold underline">
            {t('comun.reintentar')}
          </button>
        </Alerta>
      </div>
    )
  }
  if (consulta.isLoading || !consulta.data) {
    return (
      <div className="mx-auto max-w-md space-y-4">
        <div className="skeleton h-48 rounded-(--radius-card)" />
        <div className="skeleton h-40 rounded-(--radius-card)" />
      </div>
    )
  }

  const m = consulta.data
  const nivel = nivelActual(m.xp)
  const objetivo = XP_NIVEL[nivel] ?? XP_NIVEL[XP_NIVEL.length - 1]
  const base = XP_NIVEL[nivel - 1] ?? 0
  const progreso = objetivo > base ? Math.min(100, ((m.xp - base) / (objetivo - base)) * 100) : 100
  const poseidos = new Set(m.inventario.map((o) => o.clave))

  return (
    <div className="mx-auto max-w-md space-y-5">
      <TituloGrande titulo={t('lis.titulo')} />

      {aviso && (
        <Alerta tipo="exito" alCerrar={() => setAviso('')}>
          {aviso}
        </Alerta>
      )}

      {/* escaparate */}
      <div className="flex flex-col items-center gap-3 rounded-(--radius-card) bg-surface p-6">
        <MascotaLis nivel={nivel} equipados={m.equipados} tamano={140} />
        <div className="w-full">
          <div className="flex items-baseline justify-between">
            <span className="text-[17px] font-bold text-label">{m.nombre}</span>
            <span className="text-[12px] font-semibold text-accent">
              {t(`mascota.nivel${nivel}`)} · {m.xp} XP
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-fillc">
            <div className="h-2 rounded-full bg-accent transicion-spring" style={{ width: `${progreso}%` }} />
          </div>
        </div>
      </div>

      {/* juegos para ganar XP */}
      <Link
        to="/juegos"
        className="flex items-center gap-3 rounded-(--radius-card) bg-surface p-3 transicion-spring hover:bg-fillc active:scale-[0.99]"
      >
        <ArteJuego juego="carrera" className="h-14 w-14 shrink-0" />
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold text-label">{t('juegos.titulo')}</span>
          <span className="block text-[12px] text-slabel">{t('juegos.subtitulo')}</span>
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-tlabel">
          <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      {/* regalo pendiente */}
      {m.regaloBienvenidaPendiente && (
        <button
          onClick={() => {
            setAbriendo(true)
            regalo.mutate()
          }}
          disabled={abriendo}
          className="flex w-full items-center gap-3 rounded-(--radius-card) bg-accent/10 px-4 py-3 text-left transicion-spring active:scale-[0.99]"
          style={{ boxShadow: '0 0 0 1px var(--accent)' }}
        >
          <span className={`text-accent ${abriendo ? 'animate-bounce' : ''}`}>
            <Regalo tamano={26} />
          </span>
          <span>
            <span className="block text-[15px] font-semibold text-accent">{t('lis.regaloTitulo')}</span>
            <span className="block text-[12px] text-slabel">{t('lis.regaloTexto')}</span>
          </span>
        </button>
      )}

      {/* nombre */}
      <div className="rounded-(--radius-card) bg-surface p-4">
        <label className="block text-[13px] font-medium text-slabel">{t('lis.nombre')}</label>
        <div className="mt-1.5 flex gap-2">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={m.nombre}
            maxLength={24}
            className={claseCampo}
          />
          <button
            onClick={() => {
              if (nombre.trim()) guardar.mutate({ nombre: nombre.trim() })
              setNombre('')
            }}
            disabled={!nombre.trim() || guardar.isPending}
            className="shrink-0 rounded-(--radius-control) bg-accent px-4 text-[15px] font-semibold text-white disabled:opacity-40"
          >
            {t('lis.guardar')}
          </button>
        </div>
      </div>

      {/* armario */}
      <div className="rounded-(--radius-card) bg-surface p-4">
        <h2 className="mb-1 text-[16px] font-semibold text-label">{t('lis.armario')}</h2>
        <p className="mb-3 text-[12px] text-slabel">{t('lis.armarioAyuda')}</p>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {CATALOGO.map((obj) => {
            const tiene = poseidos.has(obj.clave)
            const puesto = m.equipados.includes(obj.clave)
            return (
              <button
                key={obj.clave}
                disabled={!tiene || guardar.isPending}
                onClick={() => guardar.mutate({ equipados: alternarEquipado(m.equipados, obj.clave) })}
                className={`flex flex-col items-center gap-1 rounded-(--radius-control) border p-2 transicion-spring ${
                  puesto ? 'border-accent bg-accent/10' : 'border-separator bg-bg'
                } ${!tiene ? 'opacity-35' : 'active:scale-95'}`}
              >
                <div className={tiene ? porClave(obj.clave) && colorRareza[obj.rareza] : 'text-tlabel'}>
                  <MascotaLis nivel={1} equipados={[obj.clave]} tamano={46} />
                </div>
                <span className="flex items-center justify-center text-center text-[10px] font-medium leading-tight text-label">
                  {tiene ? t(`objetos.${obj.clave}`) : <span className="text-tlabel"><Candado tamano={14} /></span>}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
