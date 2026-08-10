import { useState } from 'react'
import { cancelarReserva } from '../api/reservas'
import { ESTADOS_RESERVA } from '../api/types'
import type { EstadoReserva, Reserva } from '../api/types'
import { getErrorMessage } from '../api/client'
import { useReservas, RESERVAS_PAGE_SIZE } from '../hooks/useReservas'
import { useTopEquipos } from '../hooks/useTopEquipos'
import { useEquiposOpciones } from '../hooks/useEquiposOpciones'
import { useLanguage } from '../i18n/LanguageContext'
import ReservaFila from '../components/reservas/ReservaFila'
import ReservaModal from '../components/reservas/ReservaModal'
import ConfirmarCancelacionModal from '../components/reservas/ConfirmarCancelacionModal'
import TopEquipos from '../components/estadisticas/TopEquipos'
import Paginacion from '../components/equipos/Paginacion'

// Este archivo define la página principal de reservas del laboratorio. La vista combina filtros, listado paginado,
// creación de nuevas reservas, cancelación de reservas existentes y un panel lateral con las estadísticas del Top 5.
// Su responsabilidad es orquestar la interacción entre varios hooks y componentes reutilizables para ofrecer una
// experiencia completa al usuario.

// El componente SkeletonFila representa un esqueleto visual temporal mientras se cargan las reservas desde la API.
// Se utiliza para mejorar la percepción de carga y mantener la estructura visual de la lista.
function SkeletonFila() {
  return (
    <div className="reserva-fila reserva-fila--skeleton" aria-hidden="true">
      <div className="skeleton-card__line skeleton-card__line--title" />
      <div className="skeleton-card__line" />
      <div className="skeleton-card__line skeleton-card__line--short" />
    </div>
  )
}

// El componente ReservasPage es la vista principal de la página de reservas. Coordina el estado local de la interfaz,
// consume los hooks de datos y delega la renderización de las secciones principales a componentes reutilizables.
// También gestiona los flujos de creación y cancelación de reservas, así como los mensajes de error y estados vacíos.
export default function ReservasPage() {
  // Se obtiene la función de traducción del contexto de idioma para mostrar textos en el idioma activo.
  const { t } = useLanguage()

  // Se consumen los datos y las funciones del hook useReservas para manejar el listado paginado, los filtros y
  // la carga inicial de reservas desde la API.
  const {
    filtros,
    cambiarFiltros,
    limpiarFiltros,
    cambiarPagina,
    data,
    loading,
    error,
    reintentar,
  } = useReservas()

  // Se obtienen los datos del Top 5 de equipos más solicitados, así como la capacidad de reintentar esa consulta
  // cuando se produce una acción que modifique el estado de las reservas.
  const top = useTopEquipos()

  // Se cargan las opciones de equipos disponibles para poblar el selector de filtros y el formulario de nueva reserva.
  const { equipos, cargando: cargandoOpciones } = useEquiposOpciones()

  // Estados locales que controlan la apertura del modal de creación, el modal de confirmación de cancelación,
  // el identificador de la reserva que está siendo cancelada y el mensaje de error asociado a esa acción.
  const [modalAbierto, setModalAbierto] = useState(false)
  const [confirmarReserva, setConfirmarReserva] = useState<Reserva | null>(null)
  const [cancelandoId, setCancelandoId] = useState<number | null>(null)
  const [errorCancelar, setErrorCancelar] = useState<string | null>(null)

  // Se construye el mensaje de error de la carga inicial de reservas, utilizando el texto de fallback del idioma activo.
  const errorMsg = error
    ? getErrorMessage(error, t('reservas.error.network'))
    : null

  // Indica si existe al menos un filtro activo para mostrar el botón de limpiar filtros.
  const hayFiltros = filtros.equipoId !== '' || filtros.estado !== ''

  // La función cancelar ejecuta la petición de cancelación para una reserva específica. Actualiza el estado de carga
  // local, cierra el modal de confirmación y vuelve a disparar la consulta de reservas y estadísticas al completarse.
  async function cancelar(reserva: Reserva) {
    setCancelandoId(reserva.id)
    setErrorCancelar(null)
    try {
      await cancelarReserva(reserva.id)
      setConfirmarReserva(null)
      reintentar()
      top.reintentar()
    } catch (e) {
      setErrorCancelar(getErrorMessage(e, t('reservas.error.network')))
    } finally {
      setCancelandoId(null)
    }
  }

  // La función pedirCancelar prepara el modal de confirmación para la reserva seleccionada y limpia los errores previos.
  function pedirCancelar(reserva: Reserva) {
    setErrorCancelar(null)
    setConfirmarReserva(reserva)
  }

  // La función alGuardar se ejecuta cuando se crea correctamente una nueva reserva desde el modal.
  // Cierra el modal de creación y refresca tanto el listado de reservas como el Top 5.
  function alGuardar() {
    setModalAbierto(false)
    reintentar()
    top.reintentar()
  }

  return (
    <section>
      <div className="page-head page-head--row">
        <div>
          <h1 className="page-head__title">{t('page.reservas.title')}</h1>
          <p className="page-head__lede">{t('page.reservas.lede')}</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => setModalAbierto(true)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path
              d="M8 3v10M3 8h10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {t('reservas.nueva')}
        </button>
      </div>

      <div className="reservas-layout">
        <div className="reservas-layout__principal">
          {/* El formulario de filtros permite reducir el conjunto de reservas según el equipo y el estado seleccionado.
              También ofrece una acción rápida para limpiar los filtros aplicados y volver al listado completo. */}
          <form
            className="filtros"
            role="search"
            onSubmit={(event) => event.preventDefault()}
          >
            <label className="campo">
              <span className="campo__label">{t('reservas.filtros.equipo')}</span>
              <span className="campo__select-wrap">
                <select
                  className="campo__select"
                  value={filtros.equipoId === '' ? '' : String(filtros.equipoId)}
                  disabled={cargandoOpciones}
                  onChange={(event) =>
                    cambiarFiltros({
                      equipoId: event.target.value === '' ? '' : Number(event.target.value),
                    })
                  }
                >
                  <option value="">{t('reservas.filtros.todosEquipos')}</option>
                  {equipos.map((equipo) => (
                    <option key={equipo.id} value={equipo.id}>
                      {equipo.nombre}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            <label className="campo">
              <span className="campo__label">{t('filtros.estado')}</span>
              <span className="campo__select-wrap">
                <select
                  className="campo__select"
                  value={filtros.estado}
                  onChange={(event) =>
                    cambiarFiltros({ estado: event.target.value as EstadoReserva | '' })
                  }
                >
                  <option value="">{t('filtros.todosEstados')}</option>
                  {ESTADOS_RESERVA.map((estado) => (
                    <option key={estado} value={estado}>
                      {t(`reservaEstado.${estado}`)}
                    </option>
                  ))}
                </select>
              </span>
            </label>

            {hayFiltros && (
              <button type="button" className="btn btn--ghost" onClick={limpiarFiltros}>
                {t('filtros.limpiar')}
              </button>
            )}
          </form>

          {/* Muestra un mensaje de error si falla la carga inicial de reservas y ofrece un botón para reintentar. */}
          {errorMsg && (
            <div className="alerta" role="alert">
              <p>{errorMsg}</p>
              {error !== null && (
                <button type="button" className="btn btn--primary" onClick={reintentar}>
                  {t('reservas.error.reintentar')}
                </button>
              )}
            </div>
          )}

          {/* Mientras se cargan los datos, se muestra un placeholder visual con la misma estructura de la lista. */}
          {loading ? (
            <div className="reservas-lista" aria-label={t('reservas.cargando')}>
              {Array.from({ length: RESERVAS_PAGE_SIZE }, (_, i) => (
                <SkeletonFila key={i} />
              ))}
            </div>
          ) : data && data.contenido.length === 0 ? (
            // Cuando la consulta termina pero no hay resultados, se muestra un estado vacío con acciones
            // para limpiar filtros o crear una nueva reserva desde la misma vista.
            <div className="vacio">
              <h2 className="vacio__titulo">{t('reservas.vacio.titulo')}</h2>
              <p className="vacio__texto">{t('reservas.vacio.texto')}</p>
              <div className="vacio__acciones">
                {hayFiltros && (
                  <button type="button" className="btn btn--ghost" onClick={limpiarFiltros}>
                    {t('filtros.limpiar')}
                  </button>
                )}
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => setModalAbierto(true)}
                >
                  {t('reservas.nueva')}
                </button>
              </div>
            </div>
          ) : data ? (
            // Cuando existen resultados, se renderiza la lista de reservas usando un componente por fila para mantener
            // el código organizado y separar la presentación de la lógica de la página.
            <div className="reservas-lista">
              {data.contenido.map((reserva) => (
                <ReservaFila
                  key={reserva.id}
                  reserva={reserva}
                  cancelando={cancelandoId === reserva.id}
                  onCancelar={pedirCancelar}
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
        </div>

        <aside className="reservas-layout__lateral">
          {/* El panel lateral muestra el Top 5 de equipos más solicitados, complementando la vista principal de reservas. */}
          <TopEquipos
            data={top.data}
            loading={top.loading}
            error={top.error}
            onReintentar={top.reintentar}
          />
        </aside>
      </div>

      {/* El modal de creación se muestra solo cuando el usuario decide registrar una nueva reserva. */}
      {modalAbierto && <ReservaModal onClose={() => setModalAbierto(false)} onSaved={alGuardar} />}
      {confirmarReserva && (
        <ConfirmarCancelacionModal
          reserva={confirmarReserva}
          cancelando={cancelandoId === confirmarReserva.id}
          error={errorCancelar}
          onConfirmar={() => cancelar(confirmarReserva)}
          onClose={() => setConfirmarReserva(null)}
        />
      )}
    </section>
  )
}
