import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auth } from '../api/servicios'
import { ApiError, obtenerSesion } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import TituloGrande from '../componentes/TituloGrande'
import Alerta from '../componentes/Alerta'
import { claseBoton, claseCampo, claseEtiqueta } from '../componentes/TarjetaAuth'
import MascotaLis from '../componentes/MascotaLis'
import SheetIntruso from '../componentes/SheetIntruso'
import { marcarLlegada, obtenerMascota, registrarEvento } from '../mascota/mascota'

function nombreDispositivo(ua: string | null) {
  if (!ua) return '—'
  const aparato = /iPhone/.test(ua)
    ? 'iPhone'
    : /iPad/.test(ua)
      ? 'iPad'
      : /Android/.test(ua)
        ? 'Android'
        : /Macintosh/.test(ua)
          ? 'Mac'
          : /Windows/.test(ua)
            ? 'Windows'
            : /Linux/.test(ua)
              ? 'Linux'
              : '—'
  const navegador = /Edg/.test(ua)
    ? 'Edge'
    : /Chrome|CriOS/.test(ua)
      ? 'Chrome'
      : /Firefox|FxiOS/.test(ua)
        ? 'Firefox'
        : /Safari/.test(ua)
          ? 'Safari'
          : ''
  return navegador ? `${aparato} · ${navegador}` : aparato
}

function Chevron() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden className="text-tlabel">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SheetContrasena({ alCerrar }: { alCerrar: () => void }) {
  const { t } = useTranslation()
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (nueva !== confirmacion) {
      setError(t('auth.noCoinciden'))
      return
    }
    setCargando(true)
    try {
      const res = await auth.cambiarContrasena({ contrasenaActual: actual, contrasenaNueva: nueva })
      setAviso(res.mensaje)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('comun.errorRed'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <div
      className="velo-entrada fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={alCerrar}
    >
      <div
        className="sheet-entrada w-full rounded-t-(--radius-sheet) bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-sm sm:rounded-(--radius-sheet)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-tlabel sm:hidden" aria-hidden />
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-[18px] font-bold text-label">{t('perfil.cambiarContrasena')}</h2>
          <button
            onClick={alCerrar}
            aria-label={t('comun.cerrar')}
            className="flex h-7 w-7 items-center justify-center rounded-full bg-fillc text-[15px] text-slabel"
          >
            ×
          </button>
        </div>

        {aviso ? (
          <div className="space-y-4">
            <Alerta tipo="exito">{aviso}</Alerta>
            <button onClick={alCerrar} className={claseBoton}>
              {t('comun.cerrar')}
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-4">
            {error && (
              <Alerta tipo="error" alCerrar={() => setError('')}>
                {error}
              </Alerta>
            )}
            <label className={claseEtiqueta}>
              {t('perfil.actual')}
              <input type="password" required value={actual} onChange={(e) => setActual(e.target.value)} className={`mt-1 ${claseCampo}`} />
            </label>
            <label className={claseEtiqueta}>
              {t('perfil.nueva')}
              <input type="password" required minLength={8} value={nueva} onChange={(e) => setNueva(e.target.value)} className={`mt-1 ${claseCampo}`} />
            </label>
            <label className={claseEtiqueta}>
              {t('auth.confirmar')}
              <input type="password" required minLength={8} value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} className={`mt-1 ${claseCampo}`} />
            </label>
            <button type="submit" disabled={cargando} className={claseBoton}>
              {cargando ? t('comun.cargando') : t('perfil.guardar')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default function Perfil() {
  const { t, i18n } = useTranslation()
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [cambiando, setCambiando] = useState(false)
  const [intruso, setIntruso] = useState(false)
  const [, setRefresco] = useState(0)

  const sesiones = useQuery({
    queryKey: ['sesiones'],
    queryFn: auth.sesiones,
    enabled: !!usuario,
  })

  const revocar = useMutation({
    mutationFn: (id: string) => auth.revocarSesion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sesiones'] }),
  })

  if (!usuario) return <Navigate to="/login" replace />

  const esAdmin = usuario.rol === 'ADMIN'
  const iniciales = usuario.nombre
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join('')

  const salir = () => {
    cerrarSesion()
    navigate('/')
  }

  const lis = obtenerMascota()
  const nivelLis = 2

  return (
    <div className="mx-auto max-w-md space-y-5">
      <TituloGrande titulo={t('perfil.titulo')} />

      <div className="flex flex-col items-center gap-2 py-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent text-[28px] font-bold text-white">
          {iniciales}
        </div>
        <div className="text-center">
          <p className="text-[20px] font-semibold text-label">{usuario.nombre}</p>
          <p className="text-[14px] text-slabel">{usuario.correo}</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[12px] font-semibold ${
            esAdmin ? 'bg-warn/15 text-warn' : 'bg-accent/12 text-accent'
          }`}
        >
          {esAdmin ? t('perfil.rolAdmin') : t('perfil.rolUsuario')}
        </span>
      </div>

      <div className="separador-inset overflow-hidden rounded-(--radius-card) bg-surface">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-[16px] text-label">{t('perfil.idioma')}</span>
          <select
            value={i18n.language}
            onChange={(e) => {
              i18n.changeLanguage(e.target.value)
              registrarEvento({ tipo: 'idioma' })
            }}
            className="rounded-(--radius-control) bg-fillc px-3 py-1.5 text-[14px] font-medium text-label focus:outline-none"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
          </select>
        </div>
        {esAdmin && (
          <Link to="/admin" className="flex items-center justify-between px-4 py-3.5 transicion-spring hover:bg-fillc">
            <span className="text-[16px] text-label">{t('admin.titulo')}</span>
            <Chevron />
          </Link>
        )}
        <button
          onClick={() => setCambiando(true)}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transicion-spring hover:bg-fillc"
        >
          <span className="text-[16px] text-label">{t('perfil.cambiarContrasena')}</span>
          <Chevron />
        </button>
      </div>

      <div className="rounded-(--radius-card) bg-surface pb-1.5">
        <div className="px-4 pb-1 pt-3.5">
          <p className="text-[16px] font-semibold text-label">{t('perfil.sesiones')}</p>
          <p className="text-[12px] text-slabel">{t('perfil.sesionesTexto')}</p>
        </div>
        <div className="separador-inset">
          {!lis.llego && (
            <button
              onClick={() => setIntruso(true)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
            >
              <span className="min-w-0">
                <span className="glitch block text-[15px] font-semibold text-bad">
                  {t('intruso.dispositivo')}
                </span>
                <span className="block text-[12px] text-slabel">{t('intruso.ubicacion')}</span>
              </span>
              <span className="glitch shrink-0 text-bad">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M12 3.5 2.5 20h19L12 3.5z" />
                  <path d="M12 10v4M12 17.2v.1" />
                </svg>
              </span>
            </button>
          )}
          {sesiones.data?.map((sesion) => {
            const esActual = sesion.id === obtenerSesion()?.sesionId
            return (
              <div key={sesion.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-label">
                    {nombreDispositivo(sesion.dispositivo)}
                  </p>
                  <p className="text-[12px] text-slabel">
                    {new Date(sesion.creadoEn).toLocaleString(i18n.language, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {esActual ? (
                  <span className="shrink-0 rounded-full bg-good/12 px-2.5 py-0.5 text-[11px] font-semibold text-good">
                    {t('perfil.esteDispositivo')}
                  </span>
                ) : (
                  <button
                    onClick={() => revocar.mutate(sesion.id)}
                    disabled={revocar.isPending}
                    className="shrink-0 text-[13px] font-medium text-bad disabled:opacity-40"
                  >
                    {t('perfil.revocar')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <Link
        to="/lis"
        className="flex items-center gap-3 rounded-(--radius-card) bg-surface p-4 transicion-spring hover:bg-fillc"
      >
        <MascotaLis nivel={nivelLis} tamano={52} />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-semibold text-label">{t('mascota.titulo')}</p>
          <p className="text-[12px] text-slabel">{t('lis.irPersonalizar')}</p>
        </div>
        <Chevron />
      </Link>

      <div className="overflow-hidden rounded-(--radius-card) bg-surface">
        <button
          onClick={salir}
          className="w-full px-4 py-3.5 text-center text-[16px] font-medium text-bad transicion-spring hover:bg-fillc"
        >
          {t('app.nav.salir')}
        </button>
      </div>

      {cambiando && <SheetContrasena alCerrar={() => setCambiando(false)} />}
      {intruso && (
        <SheetIntruso
          alResolver={() => {
            marcarLlegada()
            setIntruso(false)
            setRefresco((n) => n + 1)
          }}
        />
      )}
    </div>
  )
}
