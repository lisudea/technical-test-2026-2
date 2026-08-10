import { getErrorMessage } from '../../api/client'
import type { TopEquipo } from '../../api/types'
import { useLanguage } from '../../i18n/LanguageContext'

// El componente TopEquipos muestra una lista de los 5 equipos con más incidencias. Recibe 
// como props los datos de los equipos, el estado de carga, cualquier error que haya ocurrido
//  y una función para reintentar la carga de datos. Utiliza el hook useLanguage para acceder
//  al contexto de idioma y obtener las traducciones correspondientes a las claves de texto 
// en el idioma seleccionado. Renderiza un título, una lista ordenada de equipos con su 
// nombre, cantidad de reservas y una barra visual que representa la proporción de reservas 
// en comparación con el equipo con más reservas. Si hay un error, muestra un mensaje de 
// error y un botón para reintentar; si está cargando, muestra un indicador de carga; y si 
// no hay datos, muestra un mensaje indicando que no hay equipos disponibles.
export interface TopEquiposProps {
  data: TopEquipo[] | null
  loading: boolean
  error: unknown
  onReintentar: () => void
}

export default function TopEquipos({ data, loading, error, onReintentar }: TopEquiposProps) {
  const { t } = useLanguage()
  const errorMsg = error ? getErrorMessage(error, t('top5.error.network')) : null
  const max = data && data.length > 0 ? Math.max(...data.map((d) => d.cantidadReservas)) : 0

  return (
    <section className="top5" aria-labelledby="top5-titulo">
      <h2 className="top5__titulo" id="top5-titulo">
        {t('top5.titulo')}
      </h2>

      {errorMsg ? (
        <div className="top5__error" role="alert">
          <p>{errorMsg}</p>
          <button type="button" className="btn btn--ghost" onClick={onReintentar}>
            {t('top5.reintentar')}
          </button>
        </div>
      ) : loading ? (
        <div className="top5__cargando" aria-label={t('top5.cargando')}>
          <div className="skeleton-card__line skeleton-card__line--title" />
          <div className="skeleton-card__line" />
          <div className="skeleton-card__line" />
          <div className="skeleton-card__line" />
          <div className="skeleton-card__line skeleton-card__line--short" />
        </div>
      ) : data && data.length > 0 ? (
        <ol className="top5__lista">
          {data.map((item, i) => (
            <li className="top5__item" key={item.equipoId}>
              <span className="top5__rango">{i + 1}</span>
              <span className="top5__nombre">{item.equipoNombre}</span>
              <span className="top5__cantidad">{item.cantidadReservas}</span>
              <span className="top5__barra" aria-hidden="true">
                <span
                  className="top5__barra-fill"
                  style={{
                    width: max > 0 ? `${Math.round((item.cantidadReservas / max) * 100)}%` : '0%',
                  }}
                />
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="top5__vacio">{t('top5.vacio')}</p>
      )}
    </section>
  )
}
