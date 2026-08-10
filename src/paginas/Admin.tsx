import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { auditoria, equipos, usuarios } from '../api/servicios'
import { ApiError } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import type { CategoriaEquipo, Equipo, EstadoEquipo } from '../api/tipos'
import TituloGrande from '../componentes/TituloGrande'
import EstadoBadge from '../componentes/EstadoBadge'
import Paginacion from '../componentes/Paginacion'
import Alerta from '../componentes/Alerta'
import { claseBoton, claseCampo, claseEtiqueta } from '../componentes/TarjetaAuth'

const CATEGORIAS: CategoriaEquipo[] = ['MICROCONTROLADORES', 'VR', 'REDES', 'COMPUTO', 'IMPRESION_3D']
const ESTADOS: EstadoEquipo[] = ['DISPONIBLE', 'RESERVADO', 'MANTENIMIENTO']

function SheetEquipo({ equipo, alCerrar }: { equipo?: Equipo; alCerrar: () => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [nombre, setNombre] = useState(equipo?.nombre ?? '')
  const [serial, setSerial] = useState(equipo?.serial ?? '')
  const [categoria, setCategoria] = useState<CategoriaEquipo>(equipo?.categoria ?? 'MICROCONTROLADORES')
  const [estado, setEstado] = useState<EstadoEquipo>(equipo?.estado ?? 'DISPONIBLE')
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const mutacion = useMutation({
    mutationFn: () =>
      equipo
        ? equipos.actualizar(equipo.id, { nombre, serial, categoria, estado })
        : equipos.crear({ nombre, serial, categoria, estado }),
    onSuccess: () => {
      setAviso(equipo ? t('admin.equipoActualizado') : t('admin.equipoCreado'))
      setError('')
      queryClient.invalidateQueries({ queryKey: ['equipos'] })
      queryClient.invalidateQueries({ queryKey: ['resumen'] })
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : t('comun.errorRed')),
  })

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    mutacion.mutate()
  }

  return (
    <div
      className="velo-entrada fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4"
      onClick={alCerrar}
    >
      <div
        className="sheet-entrada max-h-[88vh] w-full overflow-y-auto rounded-t-(--radius-sheet) bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-sm sm:rounded-(--radius-sheet)"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-tlabel sm:hidden" aria-hidden />
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-[18px] font-bold text-label">
            {equipo ? t('admin.editarEquipo') : t('admin.nuevoEquipo')}
          </h2>
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
              {t('admin.nombre')}
              <input required value={nombre} onChange={(e) => setNombre(e.target.value)} className={`mt-1 ${claseCampo}`} />
            </label>
            <label className={claseEtiqueta}>
              {t('admin.serial')}
              <input required value={serial} onChange={(e) => setSerial(e.target.value)} className={`mt-1 ${claseCampo}`} />
            </label>
            <label className={claseEtiqueta}>
              {t('admin.categoria')}
              <select value={categoria} onChange={(e) => setCategoria(e.target.value as CategoriaEquipo)} className={`mt-1 ${claseCampo}`}>
                {CATEGORIAS.map((c) => (
                  <option key={c} value={c}>{t(`categorias.${c}`)}</option>
                ))}
              </select>
            </label>
            <div>
              <span className={claseEtiqueta}>{t('admin.estado')}</span>
              <div className="mt-1.5 flex rounded-[9px] bg-fillc p-0.5 text-[13px] font-semibold">
                {ESTADOS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEstado(e)}
                    className={`flex-1 rounded-[7px] px-2 py-1.5 transicion-spring ${
                      estado === e ? 'bg-surface text-label shadow-sm' : 'text-slabel'
                    }`}
                  >
                    {t(`estados.${e}`)}
                  </button>
                ))}
              </div>
            </div>
            <button type="submit" disabled={mutacion.isPending} className={claseBoton}>
              {mutacion.isPending ? t('comun.cargando') : equipo ? t('admin.guardar') : t('admin.crear')}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function TabEquipos() {
  const { t } = useTranslation()
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [editando, setEditando] = useState<Equipo | null>(null)
  const [creando, setCreando] = useState(false)

  const lista = useQuery({
    queryKey: ['equipos', { buscar, pagina, admin: true }],
    queryFn: () => equipos.listar({ buscar, pagina, limite: 10 }),
  })

  return (
    <div className="space-y-4">
      <div className="flex gap-2.5">
        <input
          type="search"
          placeholder={t('admin.buscar')}
          value={buscar}
          onChange={(e) => {
            setBuscar(e.target.value)
            setPagina(1)
          }}
          className="min-w-0 flex-1 rounded-(--radius-control) bg-fillc px-3.5 py-2 text-[15px] text-label placeholder:text-tlabel focus:outline-none focus:ring-2 focus:ring-accent/60"
        />
        <button
          onClick={() => setCreando(true)}
          className="rounded-(--radius-control) bg-accent px-4 py-2 text-[15px] font-semibold text-white transicion-spring hover:opacity-90 active:scale-[0.98]"
        >
          ＋ {t('admin.nuevoEquipo')}
        </button>
      </div>

      {lista.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton h-14 rounded-(--radius-card)" />
          ))}
        </div>
      )}

      {lista.data && lista.data.datos.length === 0 && (
        <p className="rounded-(--radius-card) bg-surface px-4 py-8 text-center text-[15px] text-slabel">
          {t('admin.vacio')}
        </p>
      )}

      {lista.data && lista.data.datos.length > 0 && (
        <>
          <div className="separador-inset overflow-hidden rounded-(--radius-card) bg-surface">
            {lista.data.datos.map((equipo) => (
              <button
                key={equipo.id}
                onClick={() => setEditando(equipo)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transicion-spring hover:bg-fillc"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-label">{equipo.nombre}</p>
                  <p className="text-[12px] text-slabel">
                    {t(`categorias.${equipo.categoria}`)} · <span className="font-mono">{equipo.serial}</span>
                  </p>
                </div>
                <EstadoBadge estado={equipo.estado} />
              </button>
            ))}
          </div>
          <Paginacion pagina={lista.data.pagina} totalPaginas={lista.data.totalPaginas} alCambiar={setPagina} />
        </>
      )}

      {creando && <SheetEquipo alCerrar={() => setCreando(false)} />}
      {editando && <SheetEquipo equipo={editando} alCerrar={() => setEditando(null)} />}
    </div>
  )
}

function TabUsuarios() {
  const { t } = useTranslation()
  const { usuario: yo } = useAuth()
  const queryClient = useQueryClient()
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const lista = useQuery({
    queryKey: ['usuarios', { buscar, pagina }],
    queryFn: () => usuarios.listar({ buscar, pagina, limite: 10 }),
  })

  const cambiarRol = useMutation({
    mutationFn: ({ id, rol }: { id: string; rol: 'USUARIO' | 'ADMIN' }) =>
      usuarios.cambiarRol(id, rol),
    onSuccess: () => {
      setAviso(t('admin.rolCambiado'))
      setError('')
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    },
    onError: (e) => {
      setAviso('')
      setError(e instanceof ApiError ? e.message : t('comun.errorRed'))
    },
  })

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder={t('admin.buscar')}
        value={buscar}
        onChange={(e) => {
          setBuscar(e.target.value)
          setPagina(1)
        }}
        className="w-full rounded-(--radius-control) bg-fillc px-3.5 py-2 text-[15px] text-label placeholder:text-tlabel focus:outline-none focus:ring-2 focus:ring-accent/60"
      />

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

      {lista.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="skeleton h-14 rounded-(--radius-card)" />
          ))}
        </div>
      )}

      {lista.data && lista.data.datos.length > 0 && (
        <>
          <div className="separador-inset overflow-hidden rounded-(--radius-card) bg-surface">
            {lista.data.datos.map((persona) => {
              const esAdmin = persona.rol === 'ADMIN'
              const soyYo = persona.id === yo?.id
              return (
                <div key={persona.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fillc text-[13px] font-bold text-slabel">
                      {persona.nombre.trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-label">{persona.nombre}</p>
                      <p className="truncate text-[12px] text-slabel">{persona.correo}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2.5">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                        esAdmin ? 'bg-warn/15 text-warn' : 'bg-fillc text-slabel'
                      }`}
                    >
                      {esAdmin ? t('perfil.rolAdmin') : t('perfil.rolUsuario')}
                    </span>
                    {!soyYo && (
                      <button
                        onClick={() => {
                          if (window.confirm(t('admin.confirmarRol', { nombre: persona.nombre }))) {
                            cambiarRol.mutate({ id: persona.id, rol: esAdmin ? 'USUARIO' : 'ADMIN' })
                          }
                        }}
                        disabled={cambiarRol.isPending}
                        className="text-[13px] font-medium text-accent disabled:opacity-40"
                      >
                        {esAdmin ? t('admin.quitarAdmin') : t('admin.hacerAdmin')}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <Paginacion pagina={lista.data.pagina} totalPaginas={lista.data.totalPaginas} alCambiar={setPagina} />
        </>
      )}
    </div>
  )
}

const ACCIONES = [
  'EQUIPO_CREADO',
  'EQUIPO_ACTUALIZADO',
  'ROL_CAMBIADO',
  'RESERVA_CREADA',
  'RESERVA_CANCELADA',
] as const

const colorAccion: Record<string, string> = {
  EQUIPO_CREADO: 'bg-good/12 text-good',
  EQUIPO_ACTUALIZADO: 'bg-accent/12 text-accent',
  ROL_CAMBIADO: 'bg-warn/15 text-warn',
  RESERVA_CREADA: 'bg-accent/12 text-accent',
  RESERVA_CANCELADA: 'bg-bad/12 text-bad',
}

function TabActividad() {
  const { t, i18n } = useTranslation()
  const [accion, setAccion] = useState('')
  const [buscar, setBuscar] = useState('')
  const [desde, setDesde] = useState('')
  const [hasta, setHasta] = useState('')
  const [pagina, setPagina] = useState(1)

  const lista = useQuery({
    queryKey: ['auditoria', { accion, buscar, desde, hasta, pagina }],
    queryFn: () =>
      auditoria.listar({
        accion,
        buscar,
        desde: desde ? new Date(`${desde}T00:00:00`).toISOString() : undefined,
        hasta: hasta ? new Date(`${hasta}T23:59:59`).toISOString() : undefined,
        pagina,
        limite: 15,
      }),
    refetchInterval: 30_000,
  })

  const formatoFecha = (iso: string) =>
    new Date(iso).toLocaleString(i18n.language === 'es' ? 'es-CO' : 'en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })

  const alFiltrar = (set: (v: string) => void) => (valor: string) => {
    set(valor)
    setPagina(1)
  }

  const campoFiltro =
    'rounded-(--radius-control) bg-fillc px-3 py-2 text-[13px] font-medium text-label focus:outline-none focus:ring-2 focus:ring-accent/60'

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="search"
          placeholder={t('admin.buscar')}
          value={buscar}
          onChange={(e) => alFiltrar(setBuscar)(e.target.value)}
          className={`${campoFiltro} min-w-0 flex-1 basis-40`}
        />
        <select value={accion} onChange={(e) => alFiltrar(setAccion)(e.target.value)} className={campoFiltro}>
          <option value="">{t('admin.accion')}: {t('admin.todas')}</option>
          {ACCIONES.map((a) => (
            <option key={a} value={a}>{t(`admin.${a}`)}</option>
          ))}
        </select>
        <input
          type="date"
          aria-label={t('admin.desde')}
          value={desde}
          onChange={(e) => alFiltrar(setDesde)(e.target.value)}
          className={campoFiltro}
        />
        <input
          type="date"
          aria-label={t('admin.hasta')}
          value={hasta}
          min={desde || undefined}
          onChange={(e) => alFiltrar(setHasta)(e.target.value)}
          className={campoFiltro}
        />
      </div>

      {lista.isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="skeleton h-14 rounded-(--radius-card)" />
          ))}
        </div>
      )}

      {lista.data && lista.data.datos.length === 0 && (
        <p className="rounded-(--radius-card) bg-surface px-4 py-8 text-center text-[15px] text-slabel">
          {t('admin.vacio')}
        </p>
      )}

      {lista.data && lista.data.datos.length > 0 && (
        <>
          <div className="separador-inset overflow-hidden rounded-(--radius-card) bg-surface">
            {lista.data.datos.map((registro) => (
              <div key={registro.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${colorAccion[registro.accion] ?? 'bg-fillc text-slabel'}`}
                  >
                    {t(`admin.${registro.accion}`)}
                  </span>
                  <span className="text-[12px] text-tlabel tabular-nums">
                    {formatoFecha(registro.creadoEn)}
                  </span>
                </div>
                <p className="mt-1.5 break-words text-[14px] text-label">{registro.detalle}</p>
                <p className="mt-0.5 truncate text-[12px] text-slabel">
                  {registro.actorNombre} · {registro.actorCorreo}
                </p>
              </div>
            ))}
          </div>
          <Paginacion pagina={lista.data.pagina} totalPaginas={lista.data.totalPaginas} alCambiar={setPagina} />
        </>
      )}
    </div>
  )
}

export default function Admin() {
  const { t } = useTranslation()
  const { usuario } = useAuth()
  const [tab, setTab] = useState<'equipos' | 'usuarios' | 'actividad'>('equipos')

  if (!usuario) return <Navigate to="/login" replace />
  if (usuario.rol !== 'ADMIN') return <Navigate to="/" replace />

  return (
    <div className="space-y-5">
      <TituloGrande titulo={t('admin.titulo')} />

      <div className="flex max-w-md rounded-[8px] bg-fillc p-0.5 text-[14px] font-semibold">
        {(['equipos', 'usuarios', 'actividad'] as const).map((opcion) => (
          <button
            key={opcion}
            onClick={() => setTab(opcion)}
            className={`flex-1 rounded-[6px] px-3 py-1.5 transicion-spring ${
              tab === opcion ? 'bg-surface text-label shadow-sm' : 'text-slabel'
            }`}
          >
            {t(`admin.${opcion}`)}
          </button>
        ))}
      </div>

      {tab === 'equipos' && <TabEquipos />}
      {tab === 'usuarios' && <TabUsuarios />}
      {tab === 'actividad' && <TabActividad />}
    </div>
  )
}
