import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { equipos, reservas } from '../api/servicios'
import { ApiError } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import type { Equipo } from '../api/tipos'
import Alerta from './Alerta'
import { claseBoton, claseCampo, claseEtiqueta } from './TarjetaAuth'

const HORA_APERTURA = 6
const HORA_CIERRE = 22
const DURACIONES_MIN = [30, 60, 120]

interface Props {
  equipo: Equipo
  alCerrar: () => void
}

interface Hueco {
  desde: Date
  hasta: Date
}

function aInputLocal(fecha: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${fecha.getFullYear()}-${p(fecha.getMonth() + 1)}-${p(fecha.getDate())}T${p(fecha.getHours())}:${p(fecha.getMinutes())}`
}

function horaCorta(fecha: Date) {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(fecha.getHours())}:${p(fecha.getMinutes())}`
}

function diaLocal(desplazamiento = 0) {
  const f = new Date()
  f.setDate(f.getDate() + desplazamiento)
  return aInputLocal(f).slice(0, 10)
}

export default function ModalReserva({ equipo, alCerrar }: Props) {
  const { t, i18n } = useTranslation()
  const { usuario } = useAuth()
  const queryClient = useQueryClient()

  const [dia, setDia] = useState(diaLocal)
  const [hueco, setHueco] = useState<Hueco | null>(null)
  const [duracion, setDuracion] = useState(60)
  const [personalizada, setPersonalizada] = useState(false)
  const [horasTexto, setHorasTexto] = useState('')
  const [errorDuracion, setErrorDuracion] = useState('')
  const [manual, setManual] = useState(false)
  const [inicio, setInicio] = useState('')
  const [fin, setFin] = useState('')
  const [error, setError] = useState('')
  const [creada, setCreada] = useState(false)

  const inicioDia = useMemo(() => new Date(`${dia}T00:00:00`), [dia])
  const finDia = useMemo(() => new Date(`${dia}T23:59:59`), [dia])

  const ocupadas = useQuery({
    queryKey: ['disponibilidad', equipo.id, dia],
    queryFn: () =>
      equipos.disponibilidad(equipo.id, inicioDia.toISOString(), finDia.toISOString()),
    enabled: !!usuario,
  })

  const huecos = useMemo<Hueco[]>(() => {
    if (!ocupadas.data) return []
    const ahora = new Date()
    const franjas = ocupadas.data
      .map((r) => ({ inicio: new Date(r.inicio), fin: new Date(r.fin) }))
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())

    const apertura = new Date(inicioDia)
    apertura.setHours(HORA_APERTURA, 0, 0, 0)
    const cierre = new Date(inicioDia)
    cierre.setHours(HORA_CIERRE, 0, 0, 0)

    const libres: Hueco[] = []
    let cursor =
      apertura > ahora ? apertura : new Date(Math.ceil(ahora.getTime() / 900000) * 900000)

    for (const franja of franjas) {
      if (franja.inicio > cursor)
        libres.push({ desde: new Date(cursor), hasta: new Date(Math.min(franja.inicio.getTime(), cierre.getTime())) })
      if (franja.fin > cursor) cursor = new Date(franja.fin)
    }
    if (cursor < cierre) libres.push({ desde: new Date(cursor), hasta: cierre })

    return libres.filter((h) => h.hasta.getTime() - h.desde.getTime() >= 30 * 60 * 1000).slice(0, 6)
  }, [ocupadas.data, inicioDia])

  const duracionHueco = hueco ? (hueco.hasta.getTime() - hueco.desde.getTime()) / 60000 : 0

  const elegirHueco = (h: Hueco) => {
    setHueco(h)
    setManual(false)
    setPersonalizada(false)
    setHorasTexto('')
    setErrorDuracion('')
    setError('')
    const minutos = Math.min(60, (h.hasta.getTime() - h.desde.getTime()) / 60000)
    setDuracion(minutos)
    setInicio(aInputLocal(h.desde))
    setFin(aInputLocal(new Date(h.desde.getTime() + minutos * 60000)))
  }

  const elegirDuracion = (minutos: number) => {
    setDuracion(minutos)
    setPersonalizada(false)
    setErrorDuracion('')
    if (hueco) {
      const nuevoFin = new Date(Math.min(hueco.desde.getTime() + minutos * 60000, hueco.hasta.getTime()))
      setInicio(aInputLocal(hueco.desde))
      setFin(aInputLocal(nuevoFin))
    }
  }

  const escribirHoras = (texto: string) => {
    setHorasTexto(texto)
    if (!hueco) return
    const horas = Number(texto.replace(',', '.'))
    if (texto.trim() === '' || Number.isNaN(horas) || horas < 0.5) {
      setErrorDuracion(t('reserva.duracionInvalida'))
      setFin('')
      return
    }
    const maxHoras = duracionHueco / 60
    if (horas > maxHoras) {
      setErrorDuracion(t('reserva.maximoHueco', { horas: Math.floor(maxHoras * 2) / 2 }))
      setFin('')
      return
    }
    setErrorDuracion('')
    setDuracion(horas * 60)
    setInicio(aInputLocal(hueco.desde))
    setFin(aInputLocal(new Date(hueco.desde.getTime() + horas * 60 * 60000)))
  }

  const cambiarDia = (nuevoDia: string) => {
    setDia(nuevoDia)
    setHueco(null)
    setInicio('')
    setFin('')
  }

  const finInvalido = inicio !== '' && fin !== '' && new Date(fin) <= new Date(inicio)
  const listo = inicio !== '' && fin !== '' && !finInvalido

  const resumen =
    listo &&
    new Date(inicio).toLocaleDateString(i18n.language === 'es' ? 'es-CO' : 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })

  const mutacion = useMutation({
    mutationFn: () =>
      reservas.crear({
        equipoId: equipo.id,
        nombreUsuario: usuario!.nombre,
        correoUsuario: usuario!.correo,
        inicio: new Date(inicio).toISOString(),
        fin: new Date(fin).toISOString(),
      }),
    onSuccess: () => {
      setCreada(true)
      setError('')
      queryClient.invalidateQueries({ queryKey: ['equipos'] })
      queryClient.invalidateQueries({ queryKey: ['reservas'] })
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
      queryClient.invalidateQueries({ queryKey: ['disponibilidad'] })
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : t('comun.errorRed')),
  })

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    if (!listo) return
    setError('')
    mutacion.mutate()
  }

  const fechaICS = (valor: string) =>
    new Date(valor).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')

  const descargarICS = () => {
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//LIS UdeA//Reservas//ES',
      'BEGIN:VEVENT',
      `UID:${Date.now()}@lis-reservas`,
      `DTSTAMP:${fechaICS(new Date().toISOString())}`,
      `DTSTART:${fechaICS(inicio)}`,
      `DTEND:${fechaICS(fin)}`,
      `SUMMARY:Reserva LIS · ${equipo.nombre}`,
      `DESCRIPTION:Reserva de ${equipo.nombre} (${equipo.serial}) en el Laboratorio Integrado de Sistemas`,
      'LOCATION:Laboratorio Integrado de Sistemas · UdeA',
      'BEGIN:VALARM',
      'TRIGGER:-PT30M',
      'ACTION:DISPLAY',
      `DESCRIPTION:Reserva ${equipo.nombre} en 30 minutos`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const enlace = document.createElement('a')
    enlace.href = url
    enlace.download = `reserva-lis-${equipo.nombre.toLowerCase().replace(/\s+/g, '-')}.ics`
    enlace.click()
    URL.revokeObjectURL(url)
  }

  const enlaceGoogleCalendar = () => {
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Reserva LIS · ${equipo.nombre}`,
      dates: `${fechaICS(inicio)}/${fechaICS(fin)}`,
      details: `Reserva de ${equipo.nombre} (${equipo.serial}) en el Laboratorio Integrado de Sistemas`,
      location: 'Laboratorio Integrado de Sistemas · UdeA',
    })
    return `https://calendar.google.com/calendar/render?${params}`
  }

  const chipDia = (etiqueta: string, valor: string) => (
    <button
      type="button"
      onClick={() => cambiarDia(valor)}
      className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold transicion-spring active:scale-95 ${
        dia === valor ? 'bg-accent text-white' : 'bg-fillc text-label'
      }`}
    >
      {etiqueta}
    </button>
  )

  return (
    <div
      className="velo-entrada fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={alCerrar}
    >
      <div
        className="sheet-entrada max-h-[90vh] w-full overflow-y-auto rounded-t-(--radius-sheet) bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-md sm:rounded-(--radius-sheet)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-tlabel sm:hidden" aria-hidden />
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-[19px] font-bold tracking-tight text-label">
            {t('reserva.titulo', { nombre: equipo.nombre })}
          </h2>
          <button
            onClick={alCerrar}
            aria-label={t('comun.cerrar')}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-fillc text-[15px] text-slabel"
          >
            ×
          </button>
        </div>

        {!usuario ? (
          <div className="space-y-4">
            <p className="text-[15px] text-slabel">{t('reserva.necesitaSesion')}</p>
            <Link to="/login" className={`${claseBoton} block text-center`}>
              {t('app.nav.entrar')}
            </Link>
          </div>
        ) : creada ? (
          <div className="space-y-3">
            <Alerta tipo="exito">{t('reserva.creada')}</Alerta>
            <button type="button" onClick={descargarICS} className={claseBoton}>
              📅 {t('reserva.calendario')}
            </button>
            <a
              href={enlaceGoogleCalendar()}
              target="_blank"
              rel="noreferrer"
              className="block rounded-(--radius-control) bg-fillc px-4 py-2.5 text-center text-[16px] font-semibold text-accent transicion-spring hover:bg-fillc-hover"
            >
              {t('reserva.gcal')}
            </a>
            <button onClick={alCerrar} className="w-full py-2 text-[15px] font-medium text-slabel">
              {t('comun.cerrar')}
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-5">
            {error && (
              <Alerta tipo="error" alCerrar={() => setError('')}>
                {error}
              </Alerta>
            )}

            <div>
              <span className={claseEtiqueta}>{t('reserva.dia')}</span>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {chipDia(t('reserva.hoy'), diaLocal(0))}
                {chipDia(t('reserva.manana'), diaLocal(1))}
                <input
                  type="date"
                  value={dia}
                  min={diaLocal(0)}
                  onChange={(e) => cambiarDia(e.target.value)}
                  className="rounded-(--radius-control) bg-fillc px-3 py-1.5 text-[13px] font-medium text-label focus:outline-none"
                />
              </div>
            </div>

            <div>
              <span className={claseEtiqueta}>{t('reserva.disponibilidad')}</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {ocupadas.isLoading && <span className="skeleton h-9 w-36" />}
                {ocupadas.data && huecos.length === 0 && (
                  <span className="text-[13px] text-slabel">{t('reserva.sinHuecos')}</span>
                )}
                {huecos.map((h) => {
                  const activo = hueco?.desde.getTime() === h.desde.getTime()
                  return (
                    <button
                      key={h.desde.toISOString()}
                      type="button"
                      onClick={() => elegirHueco(h)}
                      className={`rounded-full px-3.5 py-2 text-[14px] font-semibold transicion-spring active:scale-95 ${
                        activo ? 'bg-accent text-white' : 'bg-accent/12 text-accent'
                      }`}
                    >
                      {horaCorta(h.desde)} – {horaCorta(h.hasta)}
                    </button>
                  )
                })}
              </div>
              {!hueco && !manual && huecos.length > 0 && (
                <p className="mt-2 text-[12px] text-tlabel">{t('reserva.eligeHueco')}</p>
              )}
            </div>

            {hueco && !manual && (
              <div>
                <span className={claseEtiqueta}>{t('reserva.duracion')}</span>
                <div className="mt-1.5 flex rounded-[8px] bg-fillc p-0.5 text-[13px] font-semibold">
                  {DURACIONES_MIN.filter((m) => m <= duracionHueco).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => elegirDuracion(m)}
                      className={`flex-1 rounded-[6px] px-2 py-1.5 transicion-spring ${
                        duracion === m && duracion !== duracionHueco
                          ? 'bg-surface text-label shadow-sm'
                          : 'text-slabel'
                      }`}
                    >
                      {m < 60 ? `${m} min` : `${m / 60} h`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => elegirDuracion(duracionHueco)}
                    className={`flex-1 rounded-[6px] px-2 py-1.5 transicion-spring ${
                      duracion === duracionHueco && !personalizada
                        ? 'bg-surface text-label shadow-sm'
                        : 'text-slabel'
                    }`}
                  >
                    {t('reserva.todoElHueco')}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPersonalizada(true)
                      setErrorDuracion('')
                    }}
                    className={`flex-1 rounded-[6px] px-2 py-1.5 transicion-spring ${
                      personalizada ? 'bg-surface text-label shadow-sm' : 'text-slabel'
                    }`}
                  >
                    {t('reserva.otra')}
                  </button>
                </div>
                {personalizada && (
                  <div className="mt-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.5"
                      min="0.5"
                      max={duracionHueco / 60}
                      placeholder={t('reserva.horasPersonalizadas')}
                      value={horasTexto}
                      onChange={(e) => escribirHoras(e.target.value)}
                      autoFocus
                      className={`${claseCampo} ${errorDuracion ? 'ring-2 ring-bad/60' : ''}`}
                    />
                    {errorDuracion && (
                      <p className="mt-1.5 text-[13px] font-medium text-bad">{errorDuracion}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setManual(!manual)}
              className="text-[13px] font-medium text-accent"
            >
              {t('reserva.ajustar')} {manual ? '▴' : '▾'}
            </button>

            {manual && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={claseEtiqueta}>
                  {t('reserva.inicio')}
                  <input
                    type="datetime-local"
                    min={aInputLocal(new Date())}
                    value={inicio}
                    onChange={(e) => {
                      setInicio(e.target.value)
                      setHueco(null)
                      if (e.target.value) setDia(e.target.value.slice(0, 10))
                    }}
                    className={`mt-1 ${claseCampo}`}
                  />
                </label>
                <label className={claseEtiqueta}>
                  {t('reserva.fin')}
                  <input
                    type="datetime-local"
                    min={inicio || aInputLocal(new Date())}
                    value={fin}
                    onChange={(e) => {
                      setFin(e.target.value)
                      setHueco(null)
                    }}
                    className={`mt-1 ${claseCampo}`}
                  />
                </label>
              </div>
            )}

            {finInvalido && (
              <p className="text-[13px] font-medium text-bad">{t('reserva.finAntesInicio')}</p>
            )}

            {listo && (
              <div className="rounded-(--radius-control) bg-fillc px-4 py-3 text-center">
                <p className="text-[12px] font-medium uppercase tracking-wide text-slabel">
                  {t('reserva.resumen')}
                </p>
                <p className="mt-0.5 text-[16px] font-semibold text-label">
                  {resumen} · {horaCorta(new Date(inicio))} → {horaCorta(new Date(fin))}
                </p>
              </div>
            )}

            <button type="submit" disabled={mutacion.isPending || !listo} className={claseBoton}>
              {mutacion.isPending ? t('comun.cargando') : t('reserva.confirmar')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
