interface Props {
  tipo: 'error' | 'exito'
  children: React.ReactNode
  alCerrar?: () => void
}

export default function Alerta({ tipo, children, alCerrar }: Props) {
  const estilos = tipo === 'error' ? 'bg-bad/12 text-bad' : 'bg-good/12 text-good'

  return (
    <div
      role="alert"
      className={`velo-entrada flex items-start justify-between gap-3 rounded-(--radius-control) px-4 py-3 text-[14px] font-medium ${estilos}`}
    >
      <span>{children}</span>
      {alCerrar && (
        <button
          onClick={alCerrar}
          aria-label="cerrar"
          className="text-[16px] leading-none opacity-60 hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  )
}
