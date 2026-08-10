import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { auth } from '../api/servicios'
import { ApiError } from '../api/cliente'
import TarjetaAuth, { claseBoton, claseCampo } from '../componentes/TarjetaAuth'
import Alerta from '../componentes/Alerta'

export default function RestablecerContrasena() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [listo, setListo] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (contrasena !== confirmacion) {
      setError(t('auth.noCoinciden'))
      return
    }
    setCargando(true)
    try {
      await auth.restablecerContrasena(token, contrasena)
      setListo(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('comun.errorRed'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <TarjetaAuth titulo={t('auth.restablecer.titulo')}>
      {listo ? (
        <div className="space-y-4">
          <Alerta tipo="exito">{t('auth.restablecer.listo')}</Alerta>
          <Link
            to="/login"
            className="block rounded-md bg-teal-700 px-4 py-2 text-center text-sm font-medium text-white hover:bg-teal-600"
          >
            {t('auth.entrar')}
          </Link>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          {error && (
            <Alerta tipo="error" alCerrar={() => setError('')}>
              {error}
            </Alerta>
          )}
          <label className="block text-sm font-medium text-slate-700">
            {t('auth.restablecer.nueva')}
            <input
              type="password"
              required
              minLength={8}
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              className={`mt-1 ${claseCampo}`}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            {t('auth.confirmar')}
            <input
              type="password"
              required
              minLength={8}
              value={confirmacion}
              onChange={(e) => setConfirmacion(e.target.value)}
              className={`mt-1 ${claseCampo}`}
            />
          </label>
          <button type="submit" disabled={cargando} className={claseBoton}>
            {cargando ? t('comun.cargando') : t('auth.restablecer.guardar')}
          </button>
        </form>
      )}
    </TarjetaAuth>
  )
}
