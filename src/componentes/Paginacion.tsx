import { useTranslation } from 'react-i18next'

interface Props {
  pagina: number
  totalPaginas: number
  alCambiar: (pagina: number) => void
}

export default function Paginacion({ pagina, totalPaginas, alCambiar }: Props) {
  const { t } = useTranslation()
  if (totalPaginas <= 1) return null

  return (
    <div className="flex items-center justify-center gap-6">
      <button
        className="text-[15px] font-medium text-accent disabled:opacity-30"
        disabled={pagina <= 1}
        onClick={() => alCambiar(pagina - 1)}
      >
        ‹ {t('paginacion.anterior')}
      </button>
      <span className="text-[13px] text-slabel tabular-nums">
        {t('paginacion.pagina', { actual: pagina, total: totalPaginas })}
      </span>
      <button
        className="text-[15px] font-medium text-accent disabled:opacity-30"
        disabled={pagina >= totalPaginas}
        onClick={() => alCambiar(pagina + 1)}
      >
        {t('paginacion.siguiente')} ›
      </button>
    </div>
  )
}
