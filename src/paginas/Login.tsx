import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { auth } from '../api/servicios'
import { ApiError } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import TarjetaAuth, { claseBoton, claseCampo } from '../componentes/TarjetaAuth'
import BotonGoogle from '../componentes/BotonGoogle'
import Alerta from '../componentes/Alerta'

export default function Login() {
  const { t } = useTranslation()
  const { iniciarSesion } = useAuth()
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [contrasena, setContrasena] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      iniciarSesion(await auth.login({ correo, contrasena }))
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('comun.errorRed'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <TarjetaAuth titulo={t('auth.entrar')}>
      <form onSubmit={enviar} className="space-y-4">
        {error && (
          <Alerta tipo="error" alCerrar={() => setError('')}>
            {error}
          </Alerta>
        )}
        <label className="block text-sm font-medium text-slate-700">
          {t('auth.correo')}
          <input
            type="email"
            required
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
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className={`mt-1 ${claseCampo}`}
          />
        </label>
        <button type="submit" disabled={cargando} className={claseBoton}>
          {cargando ? t('comun.cargando') : t('auth.entrar')}
        </button>
      </form>

      <div className="mt-4 space-y-3">
        <BotonGoogle alFallar={setError} />
        <div className="flex flex-col gap-1 text-center text-sm">
          <Link to="/olvide-contrasena" className="text-teal-700 hover:underline">
            {t('auth.olvide')}
          </Link>
          <Link to="/registro" className="text-teal-700 hover:underline">
            {t('auth.sinCuenta')}
          </Link>
        </div>
      </div>
    </TarjetaAuth>
  )
}
