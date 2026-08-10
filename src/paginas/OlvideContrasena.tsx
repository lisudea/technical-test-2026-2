import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { auth } from '../api/servicios'
import { ApiError } from '../api/cliente'
import TarjetaAuth, { claseBoton, claseCampo } from '../componentes/TarjetaAuth'
import Alerta from '../componentes/Alerta'

export default function OlvideContrasena() {
  const { t } = useTranslation()
  const [correo, setCorreo] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await auth.olvideContrasena(correo)
      setEnviado(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('comun.errorRed'))
    } finally {
      setCargando(false)
    }
  }

  return (
    <TarjetaAuth titulo={t('auth.recuperar.titulo')}>
      {enviado ? (
        <Alerta tipo="exito">{t('auth.recuperar.enviado')}</Alerta>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          {error && (
            <Alerta tipo="error" alCerrar={() => setError('')}>
              {error}
            </Alerta>
          )}
          <p className="text-sm text-slate-600">{t('auth.recuperar.descripcion')}</p>
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
          <button type="submit" disabled={cargando} className={claseBoton}>
            {cargando ? t('comun.cargando') : t('auth.recuperar.enviar')}
          </button>
        </form>
      )}
    </TarjetaAuth>
  )
}
