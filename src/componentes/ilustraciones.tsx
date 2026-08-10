import { useId } from 'react'

// Fotos reales (royalty-free, empaquetadas en /public/img/juegos) para los banners
// y tarjetas — más inmersivas. Los íconos chicos siguen en SVG propio, que se
// adapta a tema claro/oscuro con los tokens de color.

// --- Tarjetas de cada juego (foto real) ---

const FOTO_JUEGO: Record<string, string> = {
  memoria: '/img/juegos/memoria.jpg',
  red: '/img/juegos/red.jpg',
  carrera: '/img/juegos/carrera.jpg',
}

export function ArteJuego({ juego, className }: { juego: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className ?? ''}`}>
      <img
        src={FOTO_JUEGO[juego] ?? FOTO_JUEGO.memoria}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--accent) 22%, transparent), transparent 55%, color-mix(in srgb, var(--surface) 45%, transparent))',
        }}
      />
    </div>
  )
}

// --- Íconos de stats de la carrera ---

const STAT_TRAZO: Record<string, React.ReactNode> = {
  habilidad: <path d="M14.5 6.5a3.5 3.5 0 0 0-4.9 4.4l-4.4 4.4 1.9 1.9 4.4-4.4a3.5 3.5 0 0 0 4.4-4.9l-2 2-1.4-1.4 2-2z" />,
  reputacion: <path d="M12 4l2.3 4.7 5.2.8-3.8 3.7.9 5.1L12 15.6 7.4 18l.9-5.1L4.5 9.5l5.2-.8L12 4z" />,
  recursos: (
    <>
      <circle cx="12" cy="12" r="7.5" />
      <path d="M12 8v8M9.7 9.4h3.1a1.6 1.6 0 0 1 0 3.2H10a1.6 1.6 0 0 0 0 3.2h3.3" strokeWidth="1.4" />
    </>
  ),
  energia: <path d="M13 3L5 13h5l-1 8 8-11h-5l1-7z" />,
}

export function IconoStat({ clave, tamano = 18 }: { clave: string; tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {STAT_TRAZO[clave] ?? <circle cx="12" cy="12" r="7" />}
    </svg>
  )
}

export function Medalla({ tamano = 22 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M8 3l2 6M16 3l-2 6" />
      <circle cx="12" cy="15" r="5.5" />
      <path d="M12 12.4l1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3 1-2z" fill="currentColor" stroke="none" />
    </svg>
  )
}

// --- Nodo de red para el juego de cables (router / equipo) ---

export function IconoNodo({ tipo, tamano = 26 }: { tipo: 'router' | 'equipo'; tamano?: number }) {
  if (tipo === 'router')
    return (
      <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <rect x="4" y="12" width="16" height="7" rx="2" />
        <path d="M8 15.5h0M12 12V8M9 8a3 3 0 0 1 6 0M6.5 8a5.5 5.5 0 0 1 11 0" />
        <circle cx="8" cy="15.5" r="0.9" fill="currentColor" stroke="none" />
        <path d="M15 15.5h2" />
      </svg>
    )
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M9 20h6M12 16v4" />
    </svg>
  )
}

// --- Carrera: retratos de rol (avatar circular con símbolo) ---

const ROL_TRAZO: Record<string, React.ReactNode> = {
  desarrollo: <path d="M9.5 9L6.5 12l3 3M14.5 9l3 3-3 3M13 7l-2 10" />,
  diseno: <path d="M8 16l-1 3 3-1L18 9a2 2 0 0 0-3-3L6.5 14.5 8 16zM13.5 7.5l3 3" />,
  investigacion: (
    <>
      <circle cx="11" cy="11" r="5" />
      <path d="M14.6 14.6L19 19" />
    </>
  ),
  redes: (
    <>
      <rect x="5" y="5" width="14" height="5" rx="1.5" />
      <rect x="5" y="14" width="14" height="5" rx="1.5" />
      <path d="M8 7.5h0M8 16.5h0" />
    </>
  ),
  emprendimiento: <path d="M12 4c3 1.5 5 5 5 9l-1.5 3h-7L7 13c0-4 2-7.5 5-9zM10.5 20h3M12 9.5a1.5 1.5 0 1 0 0-.01" />,
  robotica: (
    <>
      <rect x="6" y="9" width="12" height="9" rx="2" />
      <path d="M12 6.5V9M9.5 13h0M14.5 13h0M9.5 16h5" />
    </>
  ),
  electronica: <path d="M3 12h3l1.6-4.5 3 9 3-9 1.6 4.5h3.8" />,
  electrica: <path d="M9 4v4.5M15 4v4.5M7 8.5h10v2.5a5 5 0 0 1-10 0V8.5zM12 16v4" />,
  mecanica: (
    <>
      <circle cx="12" cy="12" r="3.6" />
      <path d="M12 3.5v2.6M12 17.9v2.6M3.5 12h2.6M17.9 12h2.6M6 6l1.9 1.9M16.1 16.1L18 18M18 6l-1.9 1.9M6 18l1.9-1.9" />
    </>
  ),
  telecomunicaciones: (
    <>
      <path d="M12 12.5V21M8.5 21h7M8.8 9.2a4.5 4.5 0 0 1 6.4 0M6 6.4a8.5 8.5 0 0 1 12 0" />
      <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    </>
  ),
  ambiental: <path d="M5.5 19C5.5 11 11 5.5 19 5.5c0 8-5.5 13.5-13.5 13.5zM6 18.5c2.2-4.5 5.5-7 10-8" />,
  industrial: (
    <>
      <path d="M4 20.5V11l5 3.2V11l5 3.2V7.5l5.5 3.7v9.3z" />
      <path d="M3.5 20.5h17M7 17.5h0M12 17.5h0M16.5 17.5h0" />
    </>
  ),
  biomedica: <path d="M12 20.5S4.5 15.5 4.5 10.3A3.8 3.8 0 0 1 12 8a3.8 3.8 0 0 1 7.5 2.3c0 5.2-7.5 10.2-7.5 10.2zM7 12h2.5l1.3-2.4 1.8 4 1.2-2.1H17" />,
}

export function RetratoRol({ rol, tamano = 44 }: { rol: string; tamano?: number }) {
  const id = useId()
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.9" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="23" fill={`url(#${id})`} />
      <g transform="translate(12 12) scale(1)" stroke="var(--surface)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {ROL_TRAZO[rol] ?? <circle cx="12" cy="12" r="6" />}
      </g>
    </svg>
  )
}

export function Regalo({ tamano = 26 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4" y="9" width="16" height="11" rx="1.5" />
      <path d="M4 12.5h16M12 9v11" />
      <path d="M12 9S10.5 4.5 8.5 5.2 9.5 9 12 9zM12 9s1.5-4.5 3.5-3.8S14.5 9 12 9z" />
    </svg>
  )
}

export function Candado({ tamano = 16 }: { tamano?: number }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      <circle cx="12" cy="15" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

// --- Carrera: banner de escena por tema (foto real + overlay) ---

const FOTO_ESCENA: Record<string, string> = {
  campus: '/img/juegos/campus.jpg',
  hackathon: '/img/juegos/hackathon.jpg',
  negocio: '/img/juegos/negocio.jpg',
  investigacion: '/img/juegos/investigacion.jpg',
  comunidad: '/img/juegos/comunidad.jpg',
  crisis: '/img/juegos/crisis.jpg',
}

export function EscenaCarrera({ tema, className }: { tema: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <img
        src={FOTO_ESCENA[tema] ?? FOTO_ESCENA.campus}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--accent) 28%, transparent), transparent 42%, color-mix(in srgb, var(--surface) 80%, transparent))',
        }}
      />
    </div>
  )
}
