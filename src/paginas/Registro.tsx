import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { auth } from '../api/servicios'
import { ApiError } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import TarjetaAuth, { claseBoton, claseCampo } from '../componentes/TarjetaAuth'
import Alerta from '../componentes/Alerta'

export default function Registro() {
  const { t } = useTranslation()
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
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
      iniciarSesion(await auth.registro({ nombre, correo, contrasena }))
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('comun.errorRed'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <TarjetaAuth titulo={t('auth.registro')}>
      <form onSubmit={enviar} className="space-y-4">
        {error && (
          <Alerta tipo="error" alCerrar={() => setError('')}>
            {error}
          </Alerta>
        )}
        <label className="block text-sm font-medium text-slate-700">
          {t('auth.nombre')}
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className={`mt-1 ${claseCampo}`}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('auth.correo')}
          <input
            type="email"
            required
            placeholder="usuario@udea.edu.co"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            className={`mt-1 ${claseCampo}`}
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          {t('auth.contrasena')}
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
          {cargando ? t('comun.cargando') : t('auth.registro')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        <Link to="/login" className="text-teal-700 hover:underline">
          {t('auth.conCuenta')}
        </Link>
      </p>
    </TarjetaAuth>
  )
}
