import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { reservas } from '../api/servicios'
import { ApiError } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import type { Reserva } from '../api/tipos'
import Paginacion from '../componentes/Paginacion'
import Alerta from '../componentes/Alerta'
import TituloGrande from '../componentes/TituloGrande'

export default function Reservas() {
  const { t, i18n } = useTranslation()
  const { usuario } = useAuth()
  const queryClient = useQueryClient()
  const [pagina, setPagina] = useState(1)
  const [soloMias, setSoloMias] = useState(false)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const esAdmin = usuario?.rol === 'ADMIN'

  const lista = useQuery({
    queryKey: ['reservas', { pagina, soloMias, correo: usuario?.correo }],
    queryFn: () =>
      reservas.listar({
        pagina,
        limite: 10,
        correo: esAdmin && soloMias ? usuario!.correo : undefined,
      }),
    enabled: !!usuario,
    refetchInterval: 15_000,
  })

  const cancelar = useMutation({
    mutationFn: (id: string) => reservas.cancelar(id),
    onSuccess: () => {
      setAviso(t('reservas.cancelada'))
      setError('')
      queryClient.invalidateQueries({ queryKey: ['reservas'] })
      queryClient.invalidateQueries({ queryKey: ['equipos'] })
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
    },
    onError: (e) => {
      setAviso('')
      setError(e instanceof ApiError ? e.message : t('comun.errorRed'))
    },
  })

  const formatoFecha = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language === 'es' ? 'es-CO' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  const ChipEstado = ({ reserva }: { reserva: Reserva }) => (
    <span
      className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${
        reserva.estado === 'ACTIVA' ? 'bg-accent/12 text-accent' : 'bg-fillc text-slabel'
      }`}
    >
      {t(`reservas.${reserva.estado}`)}
    </span>
  )

  const BotonCancelar = ({ reserva }: { reserva: Reserva }) =>
    reserva.estado === 'ACTIVA' && usuario ? (
      <button
        onClick={() => cancelar.mutate(reserva.id)}
        disabled={cancelar.isPending}
        className="text-[14px] font-medium text-bad disabled:opacity-40"
      >
        {t('reservas.cancelar')}
      </button>
    ) : null

  return (
    <div className="space-y-5">
      <TituloGrande
        titulo={t('reservas.titulo')}
        subtitulo={t('reservas.subtitulo')}
        accion={
          esAdmin ? (
            <label className="flex items-center gap-2 text-[14px] font-medium text-label">
              <input
                type="checkbox"
                checked={soloMias}
                onChange={(e) => {
                  setSoloMias(e.target.checked)
                  setPagina(1)
                }}
                className="h-4.5 w-4.5 accent-(--accent)"
              />
              {t('reservas.soloMias')}
            </label>
          ) : undefined
        }
      />

      {!usuario && (
        <div className="rounded-(--radius-card) bg-surface px-4 py-10 text-center">
          <p className="text-[15px] text-slabel">{t('reservas.necesitaSesion')}</p>
          <Link
            to="/login"
            className="mt-4 inline-block rounded-(--radius-control) bg-accent px-5 py-2.5 text-[15px] font-semibold text-white"
          >
            {t('app.nav.entrar')}
          </Link>
        </div>
      )}

      {error && (
        <Alerta tipo="error" alCerrar={() => setError('')}>
          {error}
        </Alerta>
      )}
      {aviso && (
        <Alerta tipo="exito" alCerrar={() => setAviso('')}>
          {aviso}
        </Alerta>
      )}
      {lista.isError && <Alerta tipo="error">{t('comun.errorRed')}</Alerta>}

      {lista.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton h-16 rounded-(--radius-card)" />
          ))}
        </div>
      )}

      {lista.data && lista.data.datos.length === 0 && (
        <p className="rounded-(--radius-card) bg-surface px-4 py-10 text-center text-[15px] text-slabel">
          {t('reservas.vacio')}
        </p>
      )}

      {lista.data && lista.data.datos.length > 0 && (
        <>
          {/* móvil: tarjetas apiladas */}
          <div className="separador-inset overflow-hidden rounded-(--radius-card) bg-surface sm:hidden">
            {lista.data.datos.map((reserva) => (
              <div key={reserva.id} className="space-y-1.5 px-4 py-3.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[16px] font-semibold text-label">
                    {reserva.equipo?.nombre ?? reserva.equipoId}
                  </span>
                  <ChipEstado reserva={reserva} />
                </div>
                <p className="text-[13px] text-slabel">{reserva.nombreUsuario}</p>
                <p className="break-words text-[13px] text-slabel">
                  {formatoFecha(reserva.inicio)} → {formatoFecha(reserva.fin)}
                </p>
                <BotonCancelar reserva={reserva} />
              </div>
            ))}
          </div>

          {/* escritorio: tabla */}
          <div className="hidden overflow-x-auto rounded-(--radius-card) bg-surface sm:block">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="text-left text-[12px] uppercase tracking-wide text-slabel">
                  <th className="px-4 py-3 font-semibold">{t('reservas.equipo')}</th>
                  <th className="px-4 py-3 font-semibold">{t('reservas.usuario')}</th>
                  <th className="px-4 py-3 font-semibold">{t('reservas.inicio')}</th>
                  <th className="px-4 py-3 font-semibold">{t('reservas.fin')}</th>
                  <th className="px-4 py-3 font-semibold">{t('reservas.estado')}</th>
                  <th className="px-4 py-3 font-semibold">{t('reservas.acciones')}</th>
                </tr>
              </thead>
              <tbody>
                {lista.data.datos.map((reserva) => (
                  <tr key={reserva.id} style={{ boxShadow: '0 -0.5px 0 var(--separator)' }}>
                    <td className="px-4 py-3 font-medium text-label">
                      {reserva.equipo?.nombre ?? reserva.equipoId}
                    </td>
                    <td className="px-4 py-3 text-slabel">{reserva.nombreUsuario}</td>
                    <td className="px-4 py-3 text-slabel">{formatoFecha(reserva.inicio)}</td>
                    <td className="px-4 py-3 text-slabel">{formatoFecha(reserva.fin)}</td>
                    <td className="px-4 py-3">
                      <ChipEstado reserva={reserva} />
                    </td>
                    <td className="px-4 py-3">
                      <BotonCancelar reserva={reserva} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Paginacion
            pagina={lista.data.pagina}
            totalPaginas={lista.data.totalPaginas}
            alCambiar={setPagina}
          />
        </>
      )}
    </div>
  )
}
