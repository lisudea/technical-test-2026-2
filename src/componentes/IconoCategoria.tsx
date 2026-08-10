const trazos: Record<string, React.ReactNode> = {
  MICROCONTROLADORES: (
    <>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <rect x="10" y="10" width="4" height="4" rx="1" fill="currentColor" stroke="none" />
      <path d="M9.5 7V4M14.5 7V4M9.5 20v-3M14.5 20v-3M7 9.5H4M7 14.5H4M20 9.5h-3M20 14.5h-3" />
    </>
  ),
  VR: (
    <>
      <path d="M3.5 9.5A2.5 2.5 0 0 1 6 7h12a2.5 2.5 0 0 1 2.5 2.5v4A2.5 2.5 0 0 1 18 16h-3l-1.9-2.2a1.5 1.5 0 0 0-2.2 0L9 16H6a2.5 2.5 0 0 1-2.5-2.5z" />
      <circle cx="8.2" cy="11.2" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="11.2" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  REDES: (
    <>
      <circle cx="12" cy="5.5" r="2.2" />
      <circle cx="5.5" cy="17.5" r="2.2" />
      <circle cx="18.5" cy="17.5" r="2.2" />
      <path d="M10.9 7.4l-4.3 8.2M13.1 7.4l4.3 8.2M7.7 17.5h8.6" />
    </>
  ),
  COMPUTO: (
    <>
      <rect x="5" y="5.5" width="14" height="9.5" rx="1.5" />
      <path d="M3 18.5h18M9.5 15v1.5M14.5 15v1.5" />
    </>
  ),
  IMPRESION_3D: (
    <>
      <rect x="5" y="4.5" width="14" height="6" rx="1.5" />
      <path d="M8 10.5v3.5l4 2.2 4-2.2v-3.5" />
      <path d="M12 16.2V19" />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  ROBOTICA: (
    <>
      <rect x="6" y="9" width="12" height="9" rx="2" />
      <path d="M12 6.5V9M12 5a1 1 0 1 0 0-.01" />
      <circle cx="9.5" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="14.5" cy="13" r="1.1" fill="currentColor" stroke="none" />
      <path d="M9.5 16h5M4 12v3M20 12v3" />
    </>
  ),
  SERVIDOR: (
    <>
      <rect x="5" y="4.5" width="14" height="6" rx="1.5" />
      <rect x="5" y="13.5" width="14" height="6" rx="1.5" />
      <circle cx="8" cy="7.5" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="8" cy="16.5" r="0.9" fill="currentColor" stroke="none" />
      <path d="M12 7.5h4M12 16.5h4" />
    </>
  ),
  SENSOR: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M6 6l2.1 2.1M15.9 15.9L18 18M18 6l-2.1 2.1M8.1 15.9L6 18" />
    </>
  ),
}

export default function IconoCategoria({ categoria, tamano = 30 }: { categoria: string; tamano?: number }) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {trazos[categoria] ?? <circle cx="12" cy="12" r="8" />}
    </svg>
  )
}
