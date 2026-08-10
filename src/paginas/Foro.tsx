import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { foro } from '../api/servicios'
import { ApiError } from '../api/cliente'
import { useAuth } from '../auth/AuthContext'
import type { CategoriaForo } from '../api/tipos'
import TituloGrande from '../componentes/TituloGrande'
import Paginacion from '../componentes/Paginacion'
import Alerta from '../componentes/Alerta'
import { claseBoton, claseCampo, claseEtiqueta } from '../componentes/TarjetaAuth'

const CATEGORIAS: CategoriaForo[] = ['EXPERIENCIAS', 'CREACIONES', 'CONSEJOS', 'METODOLOGIAS']
const AREAS = ['Sistemas', 'Telecomunicaciones', 'Electrónica', 'Eléctrica', 'Mecánica', 'Ambiental', 'Industrial', 'Biomédica']

function SheetCrear({ alCerrar, alPublicar }: { alCerrar: () => void; alPublicar: (obj: string | null) => void }) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState('')
  const [contenido, setContenido] = useState('')
  const [categoria, setCategoria] = useState<CategoriaForo>('EXPERIENCIAS')
  const [area, setArea] = useState('')
  const [error, setError] = useState('')

  const crear = useMutation({
    mutationFn: () => foro.crear({ titulo, contenido, categoria, area: area || undefined }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['foro'] })
      queryClient.invalidateQueries({ queryKey: ['mascota'] })
      alPublicar(data.objetoGanado)
    },
    onError: (e) => setError(e instanceof ApiError ? e.message : t('comun.errorRed')),
  })

  return (
    <div className="velo-entrada fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4" onClick={alCerrar}>
      <div className="sheet-entrada max-h-[90vh] w-full overflow-y-auto rounded-t-(--radius-sheet) bg-surface p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:max-w-lg sm:rounded-(--radius-sheet)" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1 w-9 rounded-full bg-tlabel sm:hidden" aria-hidden />
        <h2 className="mb-4 text-[19px] font-bold text-label">{t('foro.nueva')}</h2>
        <form onSubmit={(e) => { e.preventDefault(); setError(''); crear.mutate() }} className="space-y-4">
          {error && <Alerta tipo="error" alCerrar={() => setError('')}>{error}</Alerta>}
          <div>
            <span className={claseEtiqueta}>{t('foro.categoria')}</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {CATEGORIAS.map((c) => (
                <button key={c} type="button" onClick={() => setCategoria(c)}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transicion-spring ${categoria === c ? 'bg-accent text-white' : 'bg-fillc text-label'}`}>
                  {t(`foro.cat.${c}`)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={claseEtiqueta}>{t('foro.area')}</span>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {AREAS.map((a) => (
                <button key={a} type="button" onClick={() => setArea((prev) => (prev === a ? '' : a))}
                  className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transicion-spring ${area === a ? 'bg-accent text-white' : 'bg-fillc text-label'}`}>
                  {a}
                </button>
              ))}
            </div>
          </div>
          <label className={claseEtiqueta}>{t('foro.titulo')}
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required minLength={4} maxLength={120} className={`mt-1 ${claseCampo}`} />
          </label>
          <label className={claseEtiqueta}>{t('foro.contenido')}
            <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} required minLength={10} maxLength={4000} rows={6}
              className={`mt-1 ${claseCampo} resize-y`} />
          </label>
          <button type="submit" disabled={crear.isPending} className={claseBoton}>
            {crear.isPending ? t('comun.cargando') : t('foro.publicar')}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Foro() {
  const { t, i18n } = useTranslation()
  const { usuario } = useAuth()
  const [categoria, setCategoria] = useState<CategoriaForo | ''>('')
  const [pagina, setPagina] = useState(1)
  const [creando, setCreando] = useState(false)
  const [aviso, setAviso] = useState('')

  const lista = useQuery({
    queryKey: ['foro', { categoria, pagina }],
    queryFn: () => foro.listar({ categoria: categoria || undefined, pagina, limite: 10 }),
    refetchInterval: 30_000,
  })

  const fecha = (iso: string) =>
    new Date(iso).toLocaleDateString(i18n.language, { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="space-y-5">
      <TituloGrande titulo={t('foro.titulo2')} subtitulo={t('foro.subtitulo')}
        accion={usuario ? (
          <button onClick={() => setCreando(true)} className="rounded-(--radius-control) bg-accent px-4 py-2 text-[15px] font-semibold text-white transicion-spring active:scale-[0.98]">
            ＋ {t('foro.publicar')}
          </button>
        ) : undefined}
      />

      {aviso && <Alerta tipo="exito" alCerrar={() => setAviso('')}>{aviso}</Alerta>}

      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setCategoria(''); setPagina(1) }}
          className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transicion-spring ${categoria === '' ? 'bg-accent text-white' : 'bg-fillc text-label'}`}>
          {t('foro.todas')}
        </button>
        {CATEGORIAS.map((c) => (
          <button key={c} onClick={() => { setCategoria(c); setPagina(1) }}
            className={`rounded-full px-3 py-1.5 text-[13px] font-semibold transicion-spring ${categoria === c ? 'bg-accent text-white' : 'bg-fillc text-label'}`}>
            {t(`foro.cat.${c}`)}
          </button>
        ))}
      </div>

      {lista.isLoading && (
        <div className="space-y-2">{Array.from({ length: 4 }, (_, i) => <div key={i} className="skeleton h-24 rounded-(--radius-card)" />)}</div>
      )}
      {lista.data && lista.data.datos.length === 0 && (
        <p className="rounded-(--radius-card) bg-surface px-4 py-10 text-center text-[15px] text-slabel">{t('foro.vacio')}</p>
      )}

      {lista.data && lista.data.datos.length > 0 && (
        <>
          <div className="space-y-2.5">
            {lista.data.datos.map((p) => (
              <Link key={p.id} to={`/foro/${p.id}`} className="block rounded-(--radius-card) bg-surface p-4 transicion-spring hover:scale-[1.01]">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent/12 px-2.5 py-0.5 text-[11px] font-semibold text-accent">{t(`foro.cat.${p.categoria}`)}</span>
                  <span className="text-[12px] text-tlabel">{fecha(p.creadaEn)}</span>
                </div>
                <h3 className="mt-1.5 text-[16px] font-semibold text-label">{p.titulo}</h3>
                <p className="mt-1 line-clamp-2 text-[14px] text-slabel">{p.contenido}</p>
                <p className="mt-1.5 text-[12px] text-tlabel">— {p.autorNombre}{p.area ? ` · ${p.area}` : ''}</p>
              </Link>
            ))}
          </div>
          <Paginacion pagina={lista.data.pagina} totalPaginas={lista.data.totalPaginas} alCambiar={setPagina} />
        </>
      )}

      {creando && (
        <SheetCrear
          alCerrar={() => setCreando(false)}
          alPublicar={(obj) => {
            setCreando(false)
            setAviso(obj ? t('foro.publicadaRegalo', { objeto: t(`objetos.${obj}`) }) : t('foro.publicada'))
          }}
        />
      )}
    </div>
  )
}
