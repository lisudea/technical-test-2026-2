interface Props {
  nivel: number
  tamano?: number
}

export default function MascotaLis({ nivel, tamano = 96 }: Props) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 64 64" aria-hidden>
      <ellipse cx="32" cy="34" rx="16.5" ry="20" fill="#1c1c1e" />
      <ellipse cx="32" cy="40.5" rx="11" ry="12" fill="#ffffff" />
      <circle cx="26.5" cy="25" r="4.6" fill="#ffffff" />
      <circle cx="37.5" cy="25" r="4.6" fill="#ffffff" />
      <circle cx="27.5" cy="25.8" r="2" fill="#1c1c1e" />
      <circle cx="36.5" cy="25.8" r="2" fill="#1c1c1e" />
      <path d="M27.5 31.5h9L32 38z" fill="#ff9f0a" />
      {nivel >= 2 && <path d="M32 39l3.6 5.2L32 53l-3.6-8.8z" fill="#0e7c74" />}
      {nivel >= 3 && (
        <g stroke="#1c1c1e" strokeWidth="1.6" fill="none">
          <circle cx="26.5" cy="25" r="6" />
          <circle cx="37.5" cy="25" r="6" />
          <path d="M32.5 25h-1M20.5 24l-3-1.5M43.5 24l3-1.5" strokeLinecap="round" />
        </g>
      )}
      <ellipse cx="23.5" cy="56.5" rx="5.5" ry="3.2" fill="#ff9f0a" />
      <ellipse cx="40.5" cy="56.5" rx="5.5" ry="3.2" fill="#ff9f0a" />
    </svg>
  )
}
