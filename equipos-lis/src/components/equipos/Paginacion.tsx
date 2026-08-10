import { useLanguage } from '../../i18n/LanguageContext'

// Este componente renderiza la barra de paginación para navegar entre páginas del listado.
// Expone la información actual de la página y botones para avanzar o retroceder, manteniendo
// la interfaz consistente con el resto de la aplicación.

export interface PaginacionProps {
  page: number
  totalPaginas: number
  onChangePage: (page: number) => void
}

export default function Paginacion({ page, totalPaginas, onChangePage }: PaginacionProps) {
  const { t } = useLanguage()
  const ultimaPagina = Math.max(totalPaginas - 1, 0)

  return (
    <nav className="paginacion" aria-label={t('paginacion.label')}>
      <p className="paginacion__info">
        <span>{t('paginacion.pagina', { actual: page + 1, total: totalPaginas })}</span>
      </p>
      <div className="paginacion__controles">
        <button
          type="button"
          className="btn btn--ghost"
          disabled={page <= 0}
          onClick={() => onChangePage(page - 1)}
        >
          {t('paginacion.anterior')}
        </button>
        <button
          type="button"
          className="btn btn--ghost"
          disabled={page >= ultimaPagina}
          onClick={() => onChangePage(page + 1)}
        >
          {t('paginacion.siguiente')}
        </button>
      </div>
    </nav>
  )
}
