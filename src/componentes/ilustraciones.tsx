import { useId } from 'react'

// Ilustraciones SVG propias (sin dependencias externas, se adaptan a tema claro/oscuro
// porque usan los tokens de color de la app). Reemplazan a los emojis.

type Props = { className?: string }

function Fondo({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="var(--accent)" stopOpacity="0.22" />
        <stop offset="1" stopColor="var(--accent)" stopOpacity="0.05" />
      </linearGradient>
    </defs>
  )
}

// --- Escenas de cada juego (banner cuadrado-ish para tarjetas) ---

export function ArteMemoria({ className }: Props) {
  const id = useId()
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <Fondo id={id} />
      <rect x="0" y="0" width="64" height="64" rx="14" fill={`url(#${id})`} />
      {[
        [10, 12],
        [28, 12],
        [46, 12],
        [10, 34],
        [28, 34],
        [46, 34],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="14" height="18" rx="3" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.4" opacity={i === 1 || i === 4 ? 1 : 0.55} />
      ))}
      <circle cx="35" cy="43" r="3.2" fill="var(--accent)" />
      <circle cx="17" cy="21" r="3.2" fill="var(--accent)" />
    </svg>
  )
}

export function ArteRed({ className }: Props) {
  const id = useId()
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <Fondo id={id} />
      <rect x="0" y="0" width="64" height="64" rx="14" fill={`url(#${id})`} />
      <path d="M32 20v10M32 30l-14 14M32 30l14 14" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
      <rect x="24" y="12" width="16" height="9" rx="2.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.6" />
      <circle cx="32" cy="16.5" r="1.4" fill="var(--accent)" />
      {[
        [18, 44],
        [46, 44],
      ].map(([x, y], i) => (
        <rect key={i} x={x - 7} y={y} width="14" height="10" rx="2.5" fill="var(--surface)" stroke="var(--accent)" strokeWidth="1.6" />
      ))}
    </svg>
  )
}

export function ArteCarrera({ className }: Props) {
  const id = useId()
  return (
    <svg viewBox="0 0 64 64" className={className} fill="none" aria-hidden>
      <Fondo id={id} />
      <rect x="0" y="0" width="64" height="64" rx="14" fill={`url(#${id})`} />
      <path d="M10 48c8 0 8-10 16-10s10-14 18-14" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="1 5" />
      <path d="M44 24l10-5-10-5v10z" fill="var(--accent)" />
      <circle cx="44" cy="19" r="1.6" fill="var(--surface)" />
      {/* birrete */}
      <path d="M18 40l10-4 10 4-10 4-10-4z" fill="var(--accent)" />
      <path d="M38 40v5" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="38" cy="46" r="1.4" fill="var(--accent)" />
    </svg>
  )
}

export function ArteJuego({ juego, className }: { juego: string; className?: string }) {
  if (juego === 'red') return <ArteRed className={className} />
  if (juego === 'carrera') return <ArteCarrera className={className} />
  return <ArteMemoria className={className} />
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

// --- Carrera: banner de escena por tema de la decisión ---

const ESCENAS: Record<string, React.ReactNode> = {
  campus: (
    <>
      <rect x="12" y="18" width="18" height="20" rx="1.5" />
      <rect x="34" y="12" width="16" height="26" rx="1.5" />
      <path d="M16 24h3M22 24h3M38 18h3M44 18h3M38 24h3M44 24h3M38 30h3M44 30h3" />
      <path d="M8 38h48" strokeWidth="1.6" />
    </>
  ),
  hackathon: (
    <>
      <rect x="14" y="14" width="24" height="16" rx="2" />
      <path d="M20 22l-3 3 3 3M32 22l3 3-3 3M27 20l-2 12" />
      <path d="M40 30l6-2-2 6M42 24l6 6" />
    </>
  ),
  negocio: (
    <>
      <path d="M10 38l10-8 8 5 14-16" strokeWidth="1.8" />
      <path d="M42 19h6v6" />
      <path d="M10 40h44" strokeWidth="1.6" />
    </>
  ),
  investigacion: (
    <>
      <circle cx="26" cy="24" r="9" />
      <path d="M32.5 30.5L42 40" strokeWidth="1.8" />
      <path d="M22 24a4 4 0 0 1 4-4" />
    </>
  ),
  comunidad: (
    <>
      <circle cx="20" cy="20" r="5" />
      <circle cx="38" cy="20" r="5" />
      <path d="M11 38c0-6 4-9 9-9s9 3 9 9M29 38c0-6 4-9 9-9s9 3 9 9" />
    </>
  ),
  crisis: (
    <>
      <path d="M30 12L14 38h32L30 12z" />
      <path d="M30 24v7M30 34v0.5" strokeWidth="2" />
    </>
  ),
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

export function EscenaCarrera({ tema, className }: { tema: string; className?: string }) {
  const id = useId()
  return (
    <svg viewBox="0 0 60 48" className={className} fill="none" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id={`${id}sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.38" />
          <stop offset="0.55" stopColor="var(--accent)" stopOpacity="0.12" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0.03" />
        </linearGradient>
        <radialGradient id={`${id}glow`} cx="0.76" cy="0.24" r="0.65">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="60" height="48" rx="10" fill="var(--surface)" />
      <rect x="0" y="0" width="60" height="48" rx="10" fill={`url(#${id}sky)`} />
      <rect x="0" y="0" width="60" height="48" rx="10" fill={`url(#${id}glow)`} />
      {/* piso con profundidad para dar sensación de escena */}
      <path d="M0 37 Q30 32 60 37 V48 H0 Z" fill="var(--accent)" opacity="0.10" />
      <path d="M0 42 Q30 39 60 42 V48 H0 Z" fill="var(--accent)" opacity="0.16" />
      <g stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none">
        {ESCENAS[tema] ?? ESCENAS.campus}
      </g>
    </svg>
  )
}
