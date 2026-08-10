import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { estadisticas } from '../api/servicios'
import { useAuth } from '../auth/AuthContext'
import IconoCategoria from '../componentes/IconoCategoria'
import { ArteJuego } from '../componentes/ilustraciones'

export default function Landing() {
  const { t } = useTranslation()
  const { usuario } = useAuth()
  const resumen = useQuery({
    queryKey: ['resumen'],
    queryFn: estadisticas.resumen,
    refetchInterval: 30_000,
  })
  const top = useQuery({ queryKey: ['top-equipos'], queryFn: () => estadisticas.topEquipos(1) })

  const stats = resumen.data && [
    { valor: resumen.data.equipos.total, texto: t('landing.statEquipos') },
    { valor: `${resumen.data.ocupacion.porcentaje}%`, texto: t('landing.statOcupacion') },
    { valor: resumen.data.reservas.ultimos7Dias, texto: t('landing.statSemana') },
  ]

  const favorito = top.data?.[0]

  return (
    <div className="space-y-12 pb-6">
      <section className="pt-8 text-center sm:pt-12">
        <img src="/favicon.svg" alt="LIS" className="mx-auto h-16 w-16 sm:h-20 sm:w-20" />
        <p className="mt-4 text-[13px] font-semibold uppercase tracking-widest text-accent">
          {t('landing.eyebrow')}
        </p>
        <h1 className="mx-auto mt-3 max-w-xl text-[34px] font-bold leading-[1.08] tracking-tight text-label sm:text-[52px]">
          {t('landing.titulo')}
        </h1>
        <p className="mx-auto mt-4 max-w-md text-[17px] leading-relaxed text-slabel">
          {t('landing.subtitulo')}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/tablero"
            className="rounded-(--radius-control) bg-accent px-6 py-3 text-[16px] font-semibold text-white transicion-spring hover:opacity-90 active:scale-[0.98]"
          >
            {t('landing.explorar')}
          </Link>
          {!usuario && (
            <Link to="/registro" className="px-4 py-3 text-[16px] font-medium text-accent">
              {t('landing.crearCuenta')}
            </Link>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-(--radius-card) bg-accent/10 p-5 sm:p-7">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-[12px] font-semibold uppercase tracking-widest text-accent">Lis · XP</p>
            <h2 className="mt-1.5 text-[22px] font-bold tracking-tight text-label sm:text-[26px]">
              {t('landing.juegaTitulo')}
            </h2>
            <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-relaxed text-slabel sm:mx-0">
              {t('landing.juegaTexto')}
            </p>
            <Link
              to="/juegos"
              className="mt-4 inline-flex rounded-(--radius-control) bg-accent px-5 py-2.5 text-[15px] font-semibold text-white transicion-spring hover:opacity-90 active:scale-[0.98]"
            >
              {t('landing.juegaCta')} →
            </Link>
          </div>
          <div className="flex shrink-0 gap-2.5">
            {['memoria', 'red', 'carrera'].map((j) => (
              <ArteJuego key={j} juego={j} className="h-16 w-16 sm:h-20 sm:w-20" />
            ))}
          </div>
        </div>
      </section>

      <section className="flex items-stretch justify-center">
        {stats
          ? stats.map((s, i) => (
              <div
                key={s.texto}
                className={`flex-1 px-3 py-2 text-center sm:px-8 ${i > 0 ? 'border-l-[0.5px] border-separator' : ''}`}
              >
                <div className="text-[30px] font-bold tabular-nums text-label sm:text-[36px]">
                  {s.valor}
                </div>
                <div className="mx-auto mt-1 max-w-32 text-[12px] leading-tight text-slabel sm:text-[13px]">
                  {s.texto}
                </div>
              </div>
            ))
          : Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton mx-2 h-24 flex-1" />)}
      </section>

      <section>
        <h2 className="text-[22px] font-bold tracking-tight text-label sm:text-[24px]">
          {t('landing.prestamosTitulo')}
        </h2>
        <p className="mt-1 text-[15px] text-slabel">{t('landing.prestamosSub')}</p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-5 sm:gap-3">
          {resumen.data
            ? Object.entries(resumen.data.equipos.porCategoria).map(([categoria, total]) => (
                <Link
                  key={categoria}
                  to="/tablero"
                  className="rounded-(--radius-card) bg-surface p-4 text-center transicion-spring hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className="flex justify-center text-accent">
                    <IconoCategoria categoria={categoria} />
                  </div>
                  <div className="mt-2 text-[14px] font-semibold text-label">
                    {t(`categorias.${categoria}`)}
                  </div>
                  <div className="text-[12px] text-slabel">
                    {total} {t('landing.unidad')}
                  </div>
                </Link>
              ))
            : Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-28" />)}
        </div>
      </section>

      {favorito && (
        <section className="rounded-(--radius-card) bg-accent/10 px-6 py-5 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest text-accent">
            {t('landing.topTitulo')}
          </p>
          <p className="mt-1.5 text-[18px] font-semibold text-label">
            {t('landing.topTexto', { nombre: favorito.equipo.nombre, total: favorito.totalReservas })}
          </p>
        </section>
      )}

      <section>
        <h2 className="text-[22px] font-bold tracking-tight text-label sm:text-[24px]">{t('landing.pasosTitulo')}</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[1, 2, 3].map((paso) => (
            <div key={paso} className="rounded-(--radius-card) bg-surface p-5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/12 text-[15px] font-bold text-accent">
                {paso}
              </div>
              <h3 className="mt-3 text-[16px] font-semibold text-label">
                {t(`landing.paso${paso}Titulo`)}
              </h3>
              <p className="mt-1 text-[14px] leading-relaxed text-slabel">
                {t(`landing.paso${paso}Texto`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 sm:grid-cols-2 sm:gap-10">
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-label sm:text-[24px]">
            {t('landing.quienesTitulo')}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slabel">
            {t('landing.quienesTexto')}
          </p>
          <p className="mt-4 border-l-2 border-accent pl-3 text-[15px] font-medium italic text-label">
            “{t('landing.lema')}”
          </p>
        </div>
        <div>
          <h2 className="text-[22px] font-bold tracking-tight text-label sm:text-[24px]">
            {t('landing.comunidadTitulo')}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-slabel">
            {t('landing.comunidadTexto')}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {[
              { nombre: 'Instagram', desc: t('landing.canalInstagram'), url: 'https://www.instagram.com/sistemasudea/' },
              { nombre: 'GitHub', desc: t('landing.canalGithub'), url: 'https://github.com/lis-udea' },
              { nombre: 'lis.udea.edu.co', desc: t('landing.canalSitio'), url: 'https://lis.udea.edu.co/' },
              { nombre: 'Correo', desc: t('landing.canalCorreo'), url: 'mailto:laboratoriois@udea.edu.co' },
            ].map((canal) => (
              <a
                key={canal.nombre}
                href={canal.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-(--radius-card) bg-surface p-3.5 transicion-spring hover:scale-[1.02] active:scale-[0.98]"
              >
                <p className="text-[14px] font-semibold text-accent">{canal.nombre} ↗</p>
                <p className="mt-0.5 text-[12px] leading-snug text-slabel">{canal.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t-[0.5px] border-separator pt-6 text-center">
        <p className="text-[13px] text-slabel">
          Laboratorio Integrado de Sistemas · Universidad de Antioquia
        </p>
        <p className="mt-1 text-[12px] text-tlabel">LIS · Telemática · Móvil IS</p>
      </footer>
    </div>
  )
}
