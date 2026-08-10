import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { equipos, estadisticas } from '../api/servicios'
import type { CategoriaEquipo, Equipo, EstadoEquipo } from '../api/tipos'
import EstadoBadge from '../componentes/EstadoBadge'
import Paginacion from '../componentes/Paginacion'
import ModalReserva from '../componentes/ModalReserva'
import Alerta from '../componentes/Alerta'
import TituloGrande from '../componentes/TituloGrande'

const CATEGORIAS: CategoriaEquipo[] = ['MICROCONTROLADORES', 'VR', 'REDES', 'COMPUTO', 'IMPRESION_3D']
const ESTADOS: EstadoEquipo[] = ['DISPONIBLE', 'RESERVADO', 'MANTENIMIENTO']
const CADA_15S = 15_000

export default function Dashboard() {
  const { t } = useTranslation()
  const [buscar, setBuscar] = useState('')
  const [categoria, setCategoria] = useState('')
  const [estado, setEstado] = useState('')
  const [pagina, setPagina] = useState(1)
  const [reservando, setReservando] = useState<Equipo | null>(null)

  const resumen = useQuery({
    queryKey: ['resumen'],
    queryFn: estadisticas.resumen,
    refetchInterval: CADA_15S,
  })
  const lista = useQuery({
    queryKey: ['equipos', { buscar, categoria, estado, pagina }],
    queryFn: () => equipos.listar({ buscar, categoria, estado, pagina, limite: 9 }),
    refetchInterval: CADA_15S,
  })
  const top = useQuery({
    queryKey: ['top-equipos'],
    queryFn: () => estadisticas.topEquipos(5),
    refetchInterval: CADA_15S * 4,
  })

  const alFiltrar =
    (set: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      set(e.target.value)
      setPagina(1)
    }

  const kpis = resumen.data && [
    { etiqueta: t('dashboard.kpi.equipos'), valor: resumen.data.equipos.total },
    { etiqueta: t('dashboard.kpi.disponibles'), valor: resumen.data.equipos.porEstado.DISPONIBLE, color: 'text-good' },
    { etiqueta: t('dashboard.kpi.reservados'), valor: resumen.data.equipos.porEstado.RESERVADO, color: 'text-bad' },
    { etiqueta: t('dashboard.kpi.mantenimiento'), valor: resumen.data.equipos.porEstado.MANTENIMIENTO, color: 'text-sgray' },
    { etiqueta: t('dashboard.kpi.reservasActivas'), valor: resumen.data.reservas.activas },
    { etiqueta: t('dashboard.kpi.ocupacion'), valor: `${resumen.data.ocupacion.porcentaje}%` },
  ]

  const maxTop = top.data?.[0]?.totalReservas ?? 1

  const campoSelect =
    'rounded-(--radius-control) bg-fillc px-3 py-2 text-[14px] font-medium text-label border-none focus:outline-none focus:ring-2 focus:ring-accent/60 appearance-none'

  return (
    <div className="space-y-6">
      <TituloGrande titulo={t('dashboard.titulo')} subtitulo={t('dashboard.subtitulo')} />

      <div className="grid grid-cols-3 gap-2.5 sm:gap-3 lg:grid-cols-6">
        {kpis
          ? kpis.map((kpi) => (
              <div key={kpi.etiqueta} className="rounded-(--radius-card) bg-surface px-3 py-3.5 sm:px-4">
                <div className={`text-[22px] font-bold tabular-nums sm:text-[24px] ${kpi.color ?? 'text-label'}`}>
                  {kpi.valor}
                </div>
                <div className="mt-0.5 text-[11px] leading-tight text-slabel sm:text-[12px]">
                  {kpi.etiqueta}
                </div>
              </div>
            ))
          : Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton h-[76px]" />)}
      </div>

      <div className="flex flex-wrap gap-2.5">
        <input
          type="search"
          placeholder={t('dashboard.buscar')}
          value={buscar}
          onChange={alFiltrar(setBuscar)}
          className="min-w-0 flex-1 basis-56 rounded-(--radius-control) bg-fillc px-3.5 py-2 text-[15px] text-label placeholder:text-tlabel focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
        <select value={categoria} onChange={alFiltrar(setCategoria)} className={campoSelect}>
          <option value="">{t('dashboard.categoria')}: {t('dashboard.todas')}</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{t(`categorias.${c}`)}</option>
          ))}
        </select>
        <select value={estado} onChange={alFiltrar(setEstado)} className={campoSelect}>
          <option value="">{t('dashboard.estado')}: {t('dashboard.todos')}</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>{t(`estados.${e}`)}</option>
          ))}
        </select>
      </div>

      {lista.isError && <Alerta tipo="error">{t('comun.errorRed')}</Alerta>}

      {lista.isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-[120px] rounded-(--radius-card)" />
          ))}
        </div>
      )}

      {lista.data && lista.data.datos.length === 0 && (
        <p className="rounded-(--radius-card) bg-surface px-4 py-10 text-center text-[15px] text-slabel">
          {t('dashboard.sinResultados')}
        </p>
      )}

      {lista.data && lista.data.datos.length > 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {lista.data.datos.map((equipo) => (
              <div key={equipo.id} className="flex flex-col gap-3 rounded-(--radius-card) bg-surface p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-[16px] font-semibold text-label">{equipo.nombre}</h3>
                    <p className="mt-0.5 text-[13px] text-slabel">
                      {t(`categorias.${equipo.categoria}`)}
                    </p>
                    <p className="text-[12px] text-tlabel">
                      {t('dashboard.serial')}: <span className="font-mono">{equipo.serial}</span>
                    </p>
                  </div>
                  <EstadoBadge estado={equipo.estado} />
                </div>
                <button
                  onClick={() => setReservando(equipo)}
                  disabled={equipo.estado === 'MANTENIMIENTO'}
                  className="mt-auto rounded-(--radius-control) bg-accent px-3 py-2 text-[15px] font-semibold text-white transicion-spring hover:opacity-90 active:scale-[0.98] disabled:bg-fillc disabled:text-tlabel"
                >
                  {t('dashboard.reservar')}
                </button>
              </div>
            ))}
          </div>
          <Paginacion
            pagina={lista.data.pagina}
            totalPaginas={lista.data.totalPaginas}
            alCambiar={setPagina}
          />
        </>
      )}

      {top.data && top.data.length > 0 && (
        <section className="rounded-(--radius-card) bg-surface p-5">
          <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-wide text-slabel">
            {t('dashboard.topEquipos')}
          </h2>
          <div className="space-y-3">
            {top.data.map((fila) => (
              <div key={fila.equipo.id} className="flex items-center gap-3">
                <span className="w-36 truncate text-[14px] text-label sm:w-56">
                  {fila.equipo.nombre}
                </span>
                <div className="h-3.5 flex-1 rounded-[4px] bg-fillc">
                  <div
                    className="h-3.5 rounded-[4px] bg-accent transicion-spring"
                    style={{ width: `${(fila.totalReservas / maxTop) * 100}%` }}
                  />
                </div>
                <span className="w-7 text-right text-[14px] font-semibold tabular-nums text-label">
                  {fila.totalReservas}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {reservando && <ModalReserva equipo={reservando} alCerrar={() => setReservando(null)} />}
    </div>
  )
}
