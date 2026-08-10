import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { auth } from '../api/servicios'
import { ApiError } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import TituloGrande from '../componentes/TituloGrande'
import Alerta from '../componentes/Alerta'
import { claseBoton, claseCampo, claseEtiqueta } from '../componentes/TarjetaAuth'
import MascotaLis from '../componentes/MascotaLis'
import { MISIONES, XP_MAXIMO, nivelActual, obtenerMascota, registrarEvento } from '../mascota/mascota'

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
  const [cambiando, setCambiando] = useState(false)

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
  const nivelLis = nivelActual(lis.xp)

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

      <div className="rounded-(--radius-card) bg-surface p-5">
        <div className="flex items-center gap-4">
          <MascotaLis nivel={nivelLis} tamano={72} />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-[17px] font-bold text-label">{t('mascota.titulo')}</p>
              <span className="text-[12px] font-semibold text-accent">
                {t(`mascota.nivel${nivelLis}`)}
              </span>
            </div>
            <p className="text-[12px] text-slabel">{t('mascota.subtitulo')}</p>
            <div className="mt-2 h-2 rounded-full bg-fillc">
              <div
                className="h-2 rounded-full bg-accent transicion-spring"
                style={{ width: `${Math.min(100, (lis.xp / XP_MAXIMO) * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-right text-[11px] tabular-nums text-tlabel">
              {lis.xp} / {XP_MAXIMO} XP
            </p>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-[12px] font-semibold uppercase tracking-wide text-slabel">
            {t('mascota.misiones')}
          </p>
          {MISIONES.map((mision) => {
            const hecha = !!lis.misiones[mision.id]
            return (
              <div key={mision.id} className="flex items-center gap-2.5">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                    hecha ? 'bg-good text-white' : 'bg-fillc text-tlabel'
                  }`}
                >
                  {hecha ? '✓' : ''}
                </span>
                <span className={`text-[14px] ${hecha ? 'text-slabel line-through' : 'text-label'}`}>
                  {t(`mascota.mision.${mision.id}`)}
                </span>
                <span className="ml-auto text-[12px] font-semibold tabular-nums text-tlabel">
                  +{mision.xp}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="overflow-hidden rounded-(--radius-card) bg-surface">
        <button
          onClick={salir}
          className="w-full px-4 py-3.5 text-center text-[16px] font-medium text-bad transicion-spring hover:bg-fillc"
        >
          {t('app.nav.salir')}
        </button>
      </div>

      {cambiando && <SheetContrasena alCerrar={() => setCambiando(false)} />}
    </div>
  )
}
