import { useState } from 'react'
import { getErrorMessage } from '../api/client'
import type { Equipo } from '../api/types'
import { useEquipos, PAGE_SIZE } from '../hooks/useEquipos'
import { useLanguage } from '../i18n/LanguageContext'
import EquipoCard from '../components/equipos/EquipoCard'
import EquipoModal from '../components/equipos/EquipoModal'
import FiltrosPanel from '../components/equipos/FiltrosPanel'
import Paginacion from '../components/equipos/Paginacion'

// Este archivo contiene el componente principal de la página de equipos. Utiliza el hook useEquipos para manejar la lógica de 
// filtrado, paginación y manejo de errores al listar equipos desde la API. Renderiza los componentes de filtros, tarjetas de
//  equipo, paginación y un modal para registrar o editar equipos. También maneja el estado del modal y las acciones relacionadas
//  con la apertura, cierre y guardado de equipos.

// La interfaz ModalState representa el estado del modal de registro o edición de equipos. Contiene un booleano que indica si el
// modal está abierto y un objeto de tipo Equipo que representa el equipo seleccionado para editar, o null si se va a registrar
//  un nuevo equipo.
function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-card__line skeleton-card__line--short" />
      <div className="skeleton-card__line skeleton-card__line--title" />
      <div className="skeleton-card__line" />
    </div>
  )
}

// La interfaz ModalState representa el estado del modal de registro o edición de equipos. Contiene un booleano que indica si el
// modal está abierto y un objeto de tipo Equipo que representa el equipo seleccionado para editar, o null si se va a registrar
//  un nuevo equipo.
interface ModalState {
  abierto: boolean
  equipo: Equipo | null
}

// El componente EquiposPage es el componente principal de la página de equipos. Utiliza el hook useEquipos para manejar la lógica de filtrado, paginación y manejo de errores al listar equipos desde la API. Renderiza los componentes de filtros, tarjetas de
//  equipo, paginación y un modal para registrar o editar equipos. También maneja el estado del modal y las acciones relacionadas
//  con la apertura, cierre y guardado de equipos.
export default function EquiposPage() {
  const { t } = useLanguage()
  const {
    filtros,
    cambiarFiltros,
    limpiarFiltros,
    cambiarPagina,
    data,
    loading,
    error,
    reintentar,
  } = useEquipos()

  const [modal, setModal] = useState<ModalState>({ abierto: false, equipo: null })

  const errorMsg = error ? getErrorMessage(error, t('equipos.error.network')) : null
  const hayFiltros = filtros.categoria !== '' || filtros.estado !== ''

  // La función cerrarModal se encarga de cerrar el modal de registro o edición de equipos. Actualiza el estado del modal 
  // estableciendo abierto en false y equipo en null.
  function cerrarModal() {
    setModal({ abierto: false, equipo: null })
  }

  // La función alGuardar se ejecuta cuando se guarda un equipo desde el modal. Cierra el modal y llama a la función reintentar
  // para volver a cargar la lista de equipos desde la API.
  function alGuardar() {
    cerrarModal()
    reintentar()
  }
  // El componente renderiza la estructura de la página de equipos, incluyendo el encabezado, los filtros, las tarjetas de equipo,
  // la paginación y el modal de registro o edición de equipos. Muestra mensajes de error y estados de carga según corresponda.
  return (
    <section>
      <div className="page-head page-head--row">
        <div>
          <h1 className="page-head__title">{t('page.equipos.title')}</h1>
          <p className="page-head__lede">{t('page.equipos.lede')}</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setModal({ abierto: true, equipo: null })}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {t('equipos.registrar')}
        </button>
      </div>

      <FiltrosPanel
        categoria={filtros.categoria}
        estado={filtros.estado}
        hayFiltros={hayFiltros}
        onCategoriaChange={(categoria) => cambiarFiltros({ categoria })}
        onEstadoChange={(estado) => cambiarFiltros({ estado })}
        onLimpiar={limpiarFiltros}
      />

      {errorMsg && (
        <div className="alerta" role="alert">
          <p>{errorMsg}</p>
          <button type="button" className="btn btn--primary" onClick={reintentar}>
            {t('equipos.error.reintentar')}
          </button>
        </div>
      )}

      {loading ? (
        <div className="equipos-grid" aria-label={t('equipos.cargando')}>
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data && data.contenido.length === 0 ? (
        <div className="vacio">
          <h2 className="vacio__titulo">{t('equipos.vacio.titulo')}</h2>
          <p className="vacio__texto">{t('equipos.vacio.texto')}</p>
          <div className="vacio__acciones">
            {hayFiltros && (
              <button type="button" className="btn btn--ghost" onClick={limpiarFiltros}>
                {t('filtros.limpiar')}
              </button>
            )}
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => setModal({ abierto: true, equipo: null })}
            >
              {t('equipos.registrar')}
            </button>
          </div>
        </div>
      ) : data ? (
        <div className="equipos-grid">
          {data.contenido.map((equipo: Equipo) => (
            <EquipoCard
              key={equipo.id}
              equipo={equipo}
              onEditar={(equipoSeleccionado) =>
                setModal({ abierto: true, equipo: equipoSeleccionado })
              }
            />
          ))}
        </div>
      ) : null}

      {data && data.totalElementos > 0 && (
        <Paginacion
          page={data.pagina}
          totalPaginas={data.totalPaginas}
          onChangePage={cambiarPagina}
        />
      )}

      {modal.abierto && (
        <EquipoModal equipo={modal.equipo} onClose={cerrarModal} onSaved={alGuardar} />
      )}
    </section>
  )
}
