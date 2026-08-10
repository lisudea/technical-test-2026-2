interface Props {
  nivel: number
  tamano?: number
  equipados?: string[]
}

export default function MascotaLis({ nivel, tamano = 96, equipados = [] }: Props) {
  const tiene = (c: string) => equipados.includes(c)

  return (
    <svg width={tamano} height={tamano} viewBox="0 0 64 64" aria-hidden>
      {/* insignia de fondo */}
      {tiene('medalla-autor') && <circle cx="32" cy="34" r="26" fill="none" stroke="#c9a227" strokeWidth="1.5" strokeDasharray="2 2" />}

      {/* cuerpo */}
      <ellipse cx="32" cy="34" rx="16.5" ry="20" fill="#1c1c1e" />
      <ellipse cx="32" cy="40.5" rx="11" ry="12" fill="#ffffff" />
      <circle cx="26.5" cy="25" r="4.6" fill="#ffffff" />
      <circle cx="37.5" cy="25" r="4.6" fill="#ffffff" />
      <circle cx="27.5" cy="25.8" r="2" fill="#1c1c1e" />
      <circle cx="36.5" cy="25.8" r="2" fill="#1c1c1e" />
      <path d="M27.5 31.5h9L32 38z" fill="#ff9f0a" />

      {/* cuello */}
      {(nivel >= 2 || tiene('bufanda-teal')) && !tiene('corbatin') && (
        <path d="M32 39l3.6 5.2L32 53l-3.6-8.8z" fill="#0e7c74" />
      )}
      {tiene('corbatin') && (
        <path d="M28.5 40l3.5 2 3.5-2-2 3 2 3-3.5-2-3.5 2 2-3z" fill="#ff453a" />
      )}

      {/* cara: gafas */}
      {(nivel >= 3 || tiene('gafas-vr')) && !tiene('gafas-vr') && (
        <g stroke="#1c1c1e" strokeWidth="1.6" fill="none">
          <circle cx="26.5" cy="25" r="6" />
          <circle cx="37.5" cy="25" r="6" />
          <path d="M32.5 25h-1M20.5 24l-3-1.5M43.5 24l3-1.5" strokeLinecap="round" />
        </g>
      )}
      {tiene('gafas-vr') && (
        <g>
          <rect x="19.5" y="21" width="25" height="9" rx="2.5" fill="#1aa192" />
          <circle cx="26.5" cy="25.5" r="2.2" fill="#7bf3e6" />
          <circle cx="37.5" cy="25.5" r="2.2" fill="#7bf3e6" />
        </g>
      )}

      {/* cabeza */}
      {tiene('gorro-lana') && (
        <g>
          <path d="M20 16c2-6 22-6 24 0z" fill="#0e7c74" />
          <rect x="19" y="15" width="26" height="3.5" rx="1.75" fill="#0b625c" />
          <circle cx="32" cy="9.5" r="2.4" fill="#ffffff" />
        </g>
      )}
      {tiene('gorro-grad') && (
        <g fill="#4f7cff">
          <path d="M14 15l18-6 18 6-18 6z" />
          <path d="M44 16v6" stroke="#ffd60a" strokeWidth="1.4" />
          <circle cx="44" cy="23" r="1.8" fill="#ffd60a" />
        </g>
      )}
      {tiene('audifonos') && (
        <g fill="none" stroke="#a06bff" strokeWidth="2.4">
          <path d="M18 24a14 14 0 0 1 28 0" />
          <rect x="15.5" y="23" width="4.5" height="8" rx="2" fill="#a06bff" />
          <rect x="44" y="23" width="4.5" height="8" rx="2" fill="#a06bff" />
        </g>
      )}

      {/* patas */}
      <ellipse cx="23.5" cy="56.5" rx="5.5" ry="3.2" fill="#ff9f0a" />
      <ellipse cx="40.5" cy="56.5" rx="5.5" ry="3.2" fill="#ff9f0a" />
    </svg>
  )
}
