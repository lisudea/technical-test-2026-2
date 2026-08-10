import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { mascota as apiMascota } from '../api/servicios'
import { useAuth } from '../auth/AuthContext'
import TituloGrande from '../componentes/TituloGrande'
import Alerta from '../componentes/Alerta'
import { claseBoton } from '../componentes/TarjetaAuth'
import { EscenaCarrera, IconoStat, Medalla, RetratoRol } from '../componentes/ilustraciones'

type Clave = 'habilidad' | 'reputacion' | 'recursos' | 'energia'
type Stats = Record<Clave, number>
type Efecto = Partial<Stats>

const TEMPORADAS = 10
const CLAVES: Clave[] = ['habilidad', 'reputacion', 'recursos', 'energia']

interface Rol {
  clave: string
  nombre: string
  desc: string
  bonus: Efecto
}

const ROLES: Rol[] = [
  { clave: 'desarrollo', nombre: 'Desarrollo de software', desc: 'Construyes productos y resuelves con código.', bonus: { habilidad: 12 } },
  { clave: 'diseno', nombre: 'Diseño y UX', desc: 'Piensas en las personas que usan lo que se crea.', bonus: { reputacion: 10, habilidad: 2 } },
  { clave: 'investigacion', nombre: 'Investigación', desc: 'Semilleros, papers y preguntas difíciles.', bonus: { habilidad: 6, reputacion: 6, recursos: -4 } },
  { clave: 'redes', nombre: 'Redes e infraestructura', desc: 'Servidores, conectividad y sistemas que no se caen.', bonus: { recursos: 10, habilidad: 2 } },
  { clave: 'emprendimiento', nombre: 'Emprendimiento', desc: 'Ideas que se vuelven negocio.', bonus: { recursos: 8, reputacion: 6, energia: -6 } },
  { clave: 'robotica', nombre: 'Robótica y hardware', desc: 'Microcontroladores, sensores y cosas que se mueven.', bonus: { habilidad: 8, recursos: -2 } },
]

interface Origen {
  nombre: string
  desc: string
  base: Stats
}

const ORIGENES: Origen[] = [
  { nombre: 'Primer semestre', desc: 'Llegas con ganas pero sin rodaje.', base: { habilidad: 30, reputacion: 20, recursos: 45, energia: 75 } },
  { nombre: 'Autodidacta', desc: 'Aprendiste solo, te falta red de contactos.', base: { habilidad: 48, reputacion: 22, recursos: 25, energia: 60 } },
  { nombre: 'Del semillero', desc: 'Vienes de investigación, con nombre pero cansado.', base: { habilidad: 38, reputacion: 45, recursos: 32, energia: 45 } },
]

type Tema = 'campus' | 'hackathon' | 'negocio' | 'investigacion' | 'comunidad' | 'crisis'

interface Opcion {
  etiqueta: string
  ef: Efecto
  desenlace: string
  logro?: string
}
interface Decision {
  tema: Tema
  texto: string
  opciones: Opcion[]
}

const DECISIONES: Decision[] = [
  {
    tema: 'investigacion',
    texto: 'Un profe te invita a un semillero de investigación, pero choca con tus materias.',
    opciones: [
      { etiqueta: 'Entro al semillero', ef: { habilidad: 12, reputacion: 8, energia: -10 }, desenlace: 'Aprendes muchísimo, aunque duermes poco.' },
      { etiqueta: 'Priorizo las materias', ef: { recursos: 8, energia: 6, reputacion: -6 }, desenlace: 'Mantienes la beca, pero pierdes el tren del semillero.' },
    ],
  },
  {
    tema: 'hackathon',
    texto: 'Sale un hackathon de 48 horas. Tienes parcial el lunes.',
    opciones: [
      { etiqueta: 'Voy con todo', ef: { habilidad: 10, reputacion: 14, energia: -16 }, desenlace: '¡Quedan finalistas!', logro: 'Finalista de hackathon' },
      { etiqueta: 'Estudio para el parcial', ef: { recursos: 6, energia: 4, reputacion: -6 }, desenlace: 'Pasas el parcial, pero te quedas con las ganas.' },
      { etiqueta: 'Voy pero me cuido', ef: { habilidad: 5, reputacion: 6, energia: -4 }, desenlace: 'Participas sin reventarte. Equilibrio.' },
    ],
  },
  {
    tema: 'campus',
    texto: 'Hay equipos libres en el laboratorio. ¿En qué te especializas este semestre?',
    opciones: [
      { etiqueta: 'Microcontroladores', ef: { habilidad: 14, energia: -4 }, desenlace: 'Te vuelves el que resuelve el hardware.' },
      { etiqueta: 'Realidad virtual', ef: { reputacion: 12, habilidad: 4 }, desenlace: 'Tus demos de VR llaman la atención.' },
      { etiqueta: 'Redes', ef: { recursos: 12, habilidad: 4 }, desenlace: 'Montas infraestructura: siempre hay trabajo pago.' },
    ],
  },
  {
    tema: 'comunidad',
    texto: 'Te ofrecen liderar un proyecto pequeño de la universidad.',
    opciones: [
      { etiqueta: 'Lo lidero', ef: { reputacion: 14, habilidad: 8, energia: -12 }, desenlace: 'Aprendes a coordinar gente. Agotador pero valió.', logro: 'Lideraste un proyecto' },
      { etiqueta: 'Apoyo sin liderar', ef: { habilidad: 6, energia: 4 }, desenlace: 'Contribuyes tranquilo, sin el peso del liderazgo.' },
    ],
  },
  {
    tema: 'negocio',
    texto: 'Tu primer proyecto propio tiene 10 usuarios reales. ¿Sigues o lo sueltas?',
    opciones: [
      { etiqueta: 'Le meto un semestre más', ef: { recursos: 12, reputacion: 10, energia: -12 }, desenlace: 'Crece a 200 usuarios. Empieza a dar plata.', logro: 'Lanzaste un producto' },
      { etiqueta: 'Lo dejo de portafolio', ef: { habilidad: 8, energia: 6 }, desenlace: 'Queda como una linda carta de presentación.' },
    ],
  },
  {
    tema: 'comunidad',
    texto: 'Un compañero te pide que le hagas su proyecto completo por plata.',
    opciones: [
      { etiqueta: 'Le cobro y lo hago', ef: { recursos: 14, reputacion: -8, energia: -8 }, desenlace: 'Buena plata, mal sabor de boca.' },
      { etiqueta: 'Le explico y lo guío', ef: { reputacion: 10, habilidad: 6, recursos: -4 }, desenlace: 'Se corre la voz de que enseñas bien.', logro: 'Mentor de la comunidad' },
      { etiqueta: 'No, tengo límites', ef: { energia: 8 }, desenlace: 'Cuidas tu tiempo y tu ética.' },
    ],
  },
  {
    tema: 'negocio',
    texto: 'Te llega una pasantía remota mal paga pero con marca reconocida.',
    opciones: [
      { etiqueta: 'Acepto por el nombre', ef: { reputacion: 14, habilidad: 8, recursos: -6, energia: -8 }, desenlace: 'El logo en tu CV abre puertas.' },
      { etiqueta: 'Busco algo mejor pago', ef: { recursos: 12, reputacion: -4 }, desenlace: 'Menos brillo, pero pagas el arriendo.' },
    ],
  },
  {
    tema: 'crisis',
    texto: 'Encuentras un bug crítico el día antes de una entrega importante.',
    opciones: [
      { etiqueta: 'Me trasnocho y lo arreglo', ef: { habilidad: 12, reputacion: 12, energia: -18 }, desenlace: 'Salvas la entrega. Todos te lo reconocen.', logro: 'Salvaste la entrega' },
      { etiqueta: 'Lo reporto y me duermo', ef: { energia: 10, reputacion: -6 }, desenlace: 'Descansas, pero la entrega salió con el bug.' },
    ],
  },
  {
    tema: 'comunidad',
    texto: 'Te invitan a contar tu experiencia en una charla del LIS.',
    opciones: [
      { etiqueta: 'Doy la charla', ef: { reputacion: 14, energia: -8 }, desenlace: 'Tu nombre queda sonando en la facultad.', logro: 'Ponente del LIS' },
      { etiqueta: 'Escribo un post', ef: { habilidad: 6, reputacion: 6 }, desenlace: 'Tu post queda de referencia para los que llegan.' },
    ],
  },
  {
    tema: 'negocio',
    texto: 'Una empresa te ofrece trabajo de medio tiempo, pero tendrías que bajar el ritmo en la U.',
    opciones: [
      { etiqueta: 'Acepto el trabajo', ef: { recursos: 16, habilidad: 6, energia: -10, reputacion: -2 }, desenlace: 'Ganas experiencia y plata, aunque la U se vuelve pesada.' },
      { etiqueta: 'Me enfoco en la U', ef: { reputacion: 8, energia: 4 }, desenlace: 'Priorizas el título. A largo plazo también suma.' },
    ],
  },
]

interface Evento {
  tema: Tema
  texto: string
  ef: Efecto
}

const EVENTOS: Evento[] = [
  { tema: 'campus', texto: 'Semestre tranquilo: avanzas parejo.', ef: { habilidad: 4, energia: 4 } },
  { tema: 'crisis', texto: 'Te enfermas en época de finales.', ef: { energia: -10, habilidad: -4 } },
  { tema: 'comunidad', texto: 'Ganas una mención en la feria de proyectos.', ef: { reputacion: 8 } },
  { tema: 'crisis', texto: 'Se cae el servidor justo en tu sustentación.', ef: { energia: -6, recursos: -6 } },
  { tema: 'negocio', texto: 'Un egresado te recomienda para un freelance.', ef: { recursos: 10 } },
  { tema: 'campus', texto: 'Reprobaste una materia técnica.', ef: { reputacion: -6, energia: -6 } },
  { tema: 'hackathon', texto: 'Noche productiva con el equipo del laboratorio.', ef: { habilidad: 8, energia: -6 } },
  { tema: 'campus', texto: 'Te tomas un respiro y recargas pilas.', ef: { energia: 12 } },
]

const clamp = (n: number) => Math.max(0, Math.min(100, n))

function aplicar(stats: Stats, ef: Efecto): Stats {
  const nuevo = { ...stats }
  for (const c of CLAVES) if (ef[c]) nuevo[c] = clamp(nuevo[c] + (ef[c] as number))
  return nuevo
}

function mezclar<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type Paso = { tipo: 'decision'; dato: Decision } | { tipo: 'evento'; dato: Evento }

function construirPlan(decisiones: number): Paso[] {
  const idxDecision = new Set(mezclar([...Array(TEMPORADAS).keys()]).slice(0, decisiones))
  const barajaDec = mezclar(DECISIONES)
  const barajaEv = mezclar(EVENTOS)
  let d = 0
  let e = 0
  const pasos: Paso[] = []
  for (let i = 0; i < TEMPORADAS; i++) {
    if (idxDecision.has(i)) pasos.push({ tipo: 'decision', dato: barajaDec[d++ % barajaDec.length] })
    else pasos.push({ tipo: 'evento', dato: barajaEv[e++ % barajaEv.length] })
  }
  return pasos
}

const DIFICULTADES = [
  { clave: 'intenso', decisiones: 8 },
  { clave: 'normal', decisiones: 6 },
  { clave: 'expres', decisiones: 4 },
] as const

function Barra({ clave, valor, t }: { clave: Clave; valor: number; t: (k: string) => string }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[12px]">
        <span className="flex items-center gap-1 text-slabel">
          <span className="text-accent"><IconoStat clave={clave} tamano={14} /></span>
          {t(`carrera.stat.${clave}`)}
        </span>
        <span className="font-semibold tabular-nums text-label">{valor}</span>
      </div>
      <div className="h-1.5 rounded-full bg-fillc">
        <div className="h-1.5 rounded-full bg-accent transicion-spring" style={{ width: `${valor}%` }} />
      </div>
    </div>
  )
}

export default function SimuladorCarrera() {
  const { t } = useTranslation()
  const { usuario } = useAuth()
  const queryClient = useQueryClient()

  const [fase, setFase] = useState<'inicio' | 'jugando' | 'fin'>('inicio')
  const [rol, setRol] = useState(0)
  const [origen, setOrigen] = useState(0)
  const [dificultad, setDificultad] = useState(1)
  const [stats, setStats] = useState<Stats>(ORIGENES[0].base)
  const [logros, setLogros] = useState<string[]>([])
  const [plan, setPlan] = useState<Paso[]>([])
  const [paso, setPaso] = useState(0)
  const [desenlace, setDesenlace] = useState<{ texto: string; logro?: string } | null>(null)
  const [pendiente, setPendiente] = useState<{ stats: Stats; logros: string[] } | null>(null)
  const [resultado, setResultado] = useState<{ xp: number; objeto: string | null; puntaje: number } | null>(null)

  const enviar = useMutation({
    mutationFn: (puntos: number) => apiMascota.sumarXp(puntos),
    onSuccess: (data, puntos) => {
      setResultado((r) => (r ? { ...r, xp: data.ganados, objeto: data.objetoGanado } : { xp: data.ganados, objeto: data.objetoGanado, puntaje: puntos }))
      queryClient.invalidateQueries({ queryKey: ['mascota'] })
    },
  })

  if (!usuario) return <Navigate to="/login" replace />

  const empezar = () => {
    setStats(aplicar(ORIGENES[origen].base, ROLES[rol].bonus))
    setLogros([])
    setPlan(construirPlan(DIFICULTADES[dificultad].decisiones))
    setPaso(0)
    setDesenlace(null)
    setResultado(null)
    setFase('jugando')
  }

  const puntaje = (s: Stats, nLogros: number) =>
    Math.round(s.habilidad * 1 + s.reputacion * 0.9 + s.recursos * 0.5 + s.energia * 0.4 + nLogros * 15)

  const terminar = (sFinal: Stats, logrosFinal: string[]) => {
    const p = puntaje(sFinal, logrosFinal.length)
    const xp = Math.max(12, Math.min(58, Math.round(p / 8)))
    setResultado({ xp, objeto: null, puntaje: p })
    setFase('fin')
    enviar.mutate(xp)
  }

  const avanzar = (nuevoStats: Stats, nuevoLogros: string[]) => {
    if (paso + 1 >= plan.length) terminar(nuevoStats, nuevoLogros)
    else {
      setPaso(paso + 1)
      setDesenlace(null)
    }
  }

  const elegir = (op: Opcion) => {
    const nuevoStats = aplicar(stats, op.ef)
    const nuevoLogros = op.logro ? [...logros, op.logro] : logros
    setStats(nuevoStats)
    setLogros(nuevoLogros)
    setDesenlace({ texto: op.desenlace, logro: op.logro })
    setPendiente({ stats: nuevoStats, logros: nuevoLogros })
  }

  const continuarEvento = (ev: Evento) => {
    const nuevoStats = aplicar(stats, ev.ef)
    setStats(nuevoStats)
    avanzar(nuevoStats, logros)
  }

  const tier = (p: number) => (p >= 260 ? 'leyenda' : p >= 200 ? 'referente' : p >= 150 ? 'solido' : p >= 100 ? 'justo' : 'cuesta')
  const temaActual = plan[paso] ? (plan[paso].dato as Decision | Evento).tema : 'campus'

  return (
    <div className="mx-auto max-w-md space-y-5">
      <Link to="/juegos" className="text-[14px] font-medium text-accent">
        ‹ {t('juegos.volver')}
      </Link>
      <TituloGrande titulo={t('carrera.titulo')} subtitulo={t('carrera.subtitulo')} />

      {fase === 'inicio' && (
        <div className="space-y-4">
          <EscenaCarrera tema="campus" className="h-32 w-full" />

          <div className="rounded-(--radius-card) bg-surface p-4">
            <p className="mb-2 text-[14px] font-semibold text-label">{t('carrera.rol')}</p>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r, i) => (
                <button
                  key={r.clave}
                  onClick={() => setRol(i)}
                  className={`flex items-center gap-2.5 rounded-(--radius-control) border p-2.5 text-left transicion-spring ${
                    rol === i ? 'border-accent bg-accent/10' : 'border-separator'
                  }`}
                >
                  <RetratoRol rol={r.clave} tamano={38} />
                  <span className="min-w-0 text-[13px] font-semibold leading-tight text-label">{r.nombre}</span>
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-slabel">{ROLES[rol].desc}</p>
          </div>

          <div className="rounded-(--radius-card) bg-surface p-4">
            <p className="mb-2 text-[14px] font-semibold text-label">{t('carrera.origen')}</p>
            <div className="space-y-2">
              {ORIGENES.map((o, i) => (
                <button
                  key={o.nombre}
                  onClick={() => setOrigen(i)}
                  className={`w-full rounded-(--radius-control) border p-3 text-left transicion-spring ${
                    origen === i ? 'border-accent bg-accent/10' : 'border-separator'
                  }`}
                >
                  <span className="block text-[15px] font-semibold text-label">{o.nombre}</span>
                  <span className="block text-[12px] text-slabel">{o.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-(--radius-card) bg-surface p-4">
            <p className="mb-2 text-[14px] font-semibold text-label">{t('carrera.dificultad')}</p>
            <div className="flex gap-2">
              {DIFICULTADES.map((d, i) => (
                <button
                  key={d.clave}
                  onClick={() => setDificultad(i)}
                  className={`flex-1 rounded-(--radius-control) px-3 py-2 text-[14px] font-semibold transicion-spring ${
                    dificultad === i ? 'bg-accent text-white' : 'bg-fillc text-label'
                  }`}
                >
                  {t(`carrera.dif.${d.clave}`)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[12px] text-slabel">{t('carrera.difAyuda', { n: DIFICULTADES[dificultad].decisiones })}</p>
          </div>

          <button onClick={empezar} className={claseBoton}>
            {t('carrera.empezar')}
          </button>
        </div>
      )}

      {fase === 'jugando' && plan[paso] && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-(--radius-card) bg-surface px-3 py-2.5">
            <RetratoRol rol={ROLES[rol].clave} tamano={34} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-semibold text-label">{ROLES[rol].nombre}</span>
              <span className="block text-[11px] text-slabel">{ORIGENES[origen].nombre}</span>
            </span>
            <span className="text-[12px] text-slabel">{t('carrera.temporada', { n: paso + 1, total: TEMPORADAS })}</span>
          </div>

          <div className="h-1.5 overflow-hidden rounded-full bg-fillc">
            <div className="h-1.5 rounded-full bg-accent transicion-spring" style={{ width: `${((paso + 1) / TEMPORADAS) * 100}%` }} />
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-(--radius-card) bg-surface p-4">
            {CLAVES.map((c) => (
              <Barra key={c} clave={c} valor={stats[c]} t={t} />
            ))}
          </div>

          <div className="overflow-hidden rounded-(--radius-card) bg-surface">
            <EscenaCarrera tema={temaActual} className="h-28 w-full" />
            <div className="p-4">
              {plan[paso].tipo === 'decision' ? (
                <>
                  <p className="text-[15px] leading-relaxed text-label">{(plan[paso].dato as Decision).texto}</p>
                  {!desenlace ? (
                    <div className="mt-3 space-y-2">
                      {(plan[paso].dato as Decision).opciones.map((op) => (
                        <button
                          key={op.etiqueta}
                          onClick={() => elegir(op)}
                          className="w-full rounded-(--radius-control) bg-fillc px-3 py-2.5 text-left text-[14px] font-medium text-label transicion-spring hover:bg-accent/10 active:scale-[0.99]"
                        >
                          {op.etiqueta}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 space-y-3">
                      <p className="text-[14px] text-slabel">{desenlace.texto}</p>
                      {desenlace.logro && (
                        <p className="flex items-center gap-2 rounded-(--radius-control) bg-warn/12 px-3 py-2 text-[13px] font-semibold text-warn">
                          <Medalla tamano={18} /> {desenlace.logro}
                        </p>
                      )}
                      <button onClick={() => pendiente && avanzar(pendiente.stats, pendiente.logros)} className={claseBoton}>
                        {t('carrera.continuar')}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-[15px] leading-relaxed text-label">{(plan[paso].dato as Evento).texto}</p>
                  <button onClick={() => continuarEvento(plan[paso].dato as Evento)} className={`mt-3 ${claseBoton}`}>
                    {t('carrera.continuar')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {fase === 'fin' && resultado && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-(--radius-card) bg-surface">
            <EscenaCarrera tema={resultado.puntaje >= 200 ? 'negocio' : 'campus'} className="h-28 w-full" />
            <div className="p-6 text-center">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-accent">{t('carrera.fin')}</p>
              <p className="mt-1 text-[24px] font-bold text-label">{t(`carrera.tier.${tier(resultado.puntaje)}`)}</p>
              <p className="mt-1 text-[13px] text-slabel">
                {ROLES[rol].nombre} · {t('carrera.puntaje', { p: resultado.puntaje })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-(--radius-card) bg-surface p-4">
            {CLAVES.map((c) => (
              <Barra key={c} clave={c} valor={stats[c]} t={t} />
            ))}
          </div>

          <div className="rounded-(--radius-card) bg-surface p-4">
            <p className="mb-2 text-[14px] font-semibold text-label">{t('carrera.logros')}</p>
            {logros.length ? (
              <ul className="space-y-1.5">
                {logros.map((l) => (
                  <li key={l} className="flex items-center gap-2 text-[14px] text-slabel">
                    <span className="text-warn"><Medalla tamano={16} /></span> {l}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-slabel">{t('carrera.sinLogros')}</p>
            )}
          </div>

          <Alerta tipo="exito">
            {t('carrera.xpGanada', { xp: resultado.xp })}
            {resultado.objeto ? ' ' + t('carrera.masObjeto', { objeto: t(`objetos.${resultado.objeto}`) }) : ''}
          </Alerta>

          <button onClick={() => setFase('inicio')} className={claseBoton}>
            {t('carrera.otra')}
          </button>
        </div>
      )}
    </div>
  )
}
