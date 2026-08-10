import { useTranslation } from 'react-i18next'
import type { EstadoEquipo } from '../api/tipos'

const estilos: Record<EstadoEquipo, { punto: string; texto: string; fondo: string }> = {
  DISPONIBLE: { punto: 'bg-good', texto: 'text-good', fondo: 'bg-good/12' },
  RESERVADO: { punto: 'bg-bad', texto: 'text-bad', fondo: 'bg-bad/12' },
  MANTENIMIENTO: { punto: 'bg-sgray', texto: 'text-sgray', fondo: 'bg-sgray/15' },
}

export default function EstadoBadge({ estado }: { estado: EstadoEquipo }) {
  const { t } = useTranslation()
  const e = estilos[estado]
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${e.fondo} ${e.texto}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${e.punto}`} aria-hidden />
      {t(`estados.${estado}`)}
    </span>
  )
}
