/**
 * ModalReserva — el panel emergente para ver, crear y cancelar reservas.
 *
 * QUÉ MUESTRA: una ventana encima del tablero con tres partes:
 *   1. El equipo elegido (nombre, código, categoría).
 *   2. Sus reservas activas, cada una con un botón de cancelar.
 *   3. Un formulario para crear una reserva nueva.
 *
 * QUÉ NECESITA (props):
 *   - equipo: el equipo sobre el que se va a reservar.
 *   - onCerrar: función que se ejecuta al cerrar el panel.
 *   - onCambio: función que se ejecuta tras crear o cancelar una reserva,
 *               para que el tablero de fuera se actualice.
 *
 * CÓMO SE USA:
 *     <ModalReserva
 *       equipo={equipoElegido}
 *       onCerrar={() => setEquipoElegido(null)}
 *       onCambio={recargar}
 *     />
 *
 * ─────────────────────────────────────────────────────────────────────────
 * AQUÍ ES DONDE SE CUMPLE EL REQUISITO 6 DEL ENUNCIADO (errores en la
 * interfaz). Todo lo que puede salir mal —horario ocupado, datos inválidos,
 * servidor apagado— acaba en un mensaje claro dentro de este panel, nunca en
 * un error de consola ni en una pantalla rota.
 * ─────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useState } from 'react'

import { cancelarReserva, crearReserva, mensajeAmigable } from '../api'
import Aviso from './Aviso'

/**
 * Convierte una fecha en el texto que entienden los campos de fecha y hora
 * del navegador.
 *
 * Los campos <input type="datetime-local"> solo aceptan el formato
 * "2026-08-15T09:00" (sin segundos y sin zona horaria), así que hay que
 * recortarlo. Además usan la hora LOCAL de quien mira la pantalla, no la
 * universal, por eso se resta el desfase horario.
 *
 * @param {Date} fecha - La fecha a convertir.
 * @returns {string} Texto en formato "AAAA-MM-DDTHH:MM".
 */
function paraCampoFecha(fecha) {
  const desfase = fecha.getTimezoneOffset() * 60000
  return new Date(fecha.getTime() - desfase).toISOString().slice(0, 16)
}

/**
 * Muestra una fecha de forma legible para una persona.
 *
 * @param {string} textoFecha - La fecha tal y como la envió el backend.
 * @returns {string} Algo como "15 ago, 09:00".
 */
function formatearFecha(textoFecha) {
  return new Date(textoFecha).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function ModalReserva({ equipo, onCerrar, onCambio }) {
  // ── Las reservas activas de ESTE equipo ─────────────────────────────────
  const [reservas, setReservas] = useState([])
  const [cargandoReservas, setCargandoReservas] = useState(true)

  // ── Los datos del formulario ────────────────────────────────────────────
  // Se arranca con un horario sugerido: dentro de una hora, durante dos horas.
  // Así quien reserva no tiene que escribir la fecha entera desde cero.
  const dentroDeUnaHora = new Date(Date.now() + 60 * 60 * 1000)
  const dosHorasDespues = new Date(Date.now() + 3 * 60 * 60 * 1000)

  const [formulario, setFormulario] = useState({
    solicitante_nombre: '',
    solicitante_correo: '',
    fecha_hora_inicio: paraCampoFecha(dentroDeUnaHora),
    fecha_hora_fin: paraCampoFecha(dosHorasDespues),
  })

  // ── Mensajes y estado del envío ─────────────────────────────────────────
  const [error, setError] = useState(null)
  const [exito, setExito] = useState(null)
  const [enviando, setEnviando] = useState(false)

  /**
   * Pide al backend las reservas activas de este equipo.
   *
   * Se piden aquí, y no se reutilizan las del tablero, porque el tablero solo
   * guarda QUÉ equipos están ocupados ahora (un conjunto de identificadores),
   * no el detalle de cada reserva. Aquí hace falta el detalle completo: quién
   * reservó, desde cuándo y hasta cuándo.
   */
  async function cargarReservas() {
    setCargandoReservas(true)
    try {
      const respuesta = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/reservas?equipo_id=${equipo.id}&estado=ACTIVA&size=100`,
      )
      const datos = await respuesta.json()
      setReservas(datos.items ?? [])
    } catch {
      // Si esto falla no se muestra un error grande: el formulario de abajo
      // sigue siendo utilizable, y no queremos bloquear la acción principal
      // por no haber podido mostrar una lista informativa.
      setReservas([])
    } finally {
      setCargandoReservas(false)
    }
  }

  // Se cargan al abrir el panel. La lista [equipo.id] significa "vuelve a
  // ejecutar esto si cambia el equipo".
  useEffect(() => {
    cargarReservas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipo.id])

  /**
   * Actualiza un campo del formulario cuando la persona escribe.
   *
   * Un solo manejador para los cuatro campos: se usa el atributo `name` de
   * cada campo para saber cuál cambiar. La alternativa serían cuatro funciones
   * casi idénticas.
   */
  function alEscribir(evento) {
    const { name, value } = evento.target
    setFormulario((anterior) => ({ ...anterior, [name]: value }))
  }

  /**
   * Envía la reserva al backend. Aquí ocurre lo importante.
   *
   * PASO A PASO:
   *   1. Se evita que el navegador recargue la página (comportamiento por
   *      defecto de los formularios, que aquí no queremos).
   *   2. Se limpian los mensajes anteriores y se marca "enviando", lo que
   *      deshabilita el botón para que no se pueda pulsar dos veces y crear
   *      la reserva por duplicado.
   *   3. Se envía. Las fechas se convierten a formato universal antes.
   *   4. Si sale bien: mensaje de éxito, se recargan las reservas del panel y
   *      se avisa al tablero para que se actualice.
   *   5. Si falla: se ATRAPA el error y se traduce a un mensaje comprensible.
   *      Sin este `catch`, un 409 dejaría la aplicación colgada o mostraría un
   *      error técnico en la consola, que es justo lo que hay que evitar.
   *   6. Pase lo que pase, se vuelve a habilitar el botón.
   */
  async function alEnviar(evento) {
    evento.preventDefault()

    setError(null)
    setExito(null)
    setEnviando(true)

    try {
      await crearReserva({
        equipo_id: equipo.id,
        solicitante_nombre: formulario.solicitante_nombre,
        solicitante_correo: formulario.solicitante_correo,
        // toISOString() convierte la hora local que escribió la persona al
        // formato universal que espera el backend.
        fecha_hora_inicio: new Date(formulario.fecha_hora_inicio).toISOString(),
        fecha_hora_fin: new Date(formulario.fecha_hora_fin).toISOString(),
      })

      setExito('Reserva creada correctamente.')
      await cargarReservas()
      onCambio()
    } catch (fallo) {
      // AQUÍ ATERRIZA EL ERROR 409. mensajeAmigable() lo convierte en algo
      // como "Ese horario ya está ocupado. Elige otro…".
      setError(mensajeAmigable(fallo))
    } finally {
      setEnviando(false)
    }
  }

  /**
   * Cancela una reserva existente, tras pedir confirmación.
   *
   * @param {number} reservaId - La reserva a cancelar.
   */
  async function alCancelar(reservaId) {
    // confirm() muestra la ventana del navegador "¿Aceptar / Cancelar?".
    // Se usa aquí porque cancelar es una acción difícil de deshacer y conviene
    // una barrera; para los mensajes normales sí usamos avisos propios,
    // porque quedan integrados en el panel y se ven mejor.
    if (!window.confirm('¿Seguro que quieres cancelar esta reserva?')) return

    setError(null)
    setExito(null)

    try {
      await cancelarReserva(reservaId)
      setExito('Reserva cancelada.')
      await cargarReservas()
      onCambio()
    } catch (fallo) {
      setError(mensajeAmigable(fallo))
    }
  }

  return (
    /*
     * EL FONDO OSCURO. "fixed inset-0" lo hace ocupar toda la pantalla, y
     * "z-50" lo pone por encima de todo lo demás.
     *
     * Al pulsar el fondo se cierra el panel, que es lo que la gente espera.
     */
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      onClick={onCerrar}
    >
      {/*
       * LA VENTANA.
       *   - En celular: pegada abajo y a todo el ancho (más cómoda para el
       *     pulgar), con las esquinas superiores redondeadas.
       *   - A partir de 640px (sm:): centrada, con ancho máximo y todas las
       *     esquinas redondeadas.
       *
       * `stopPropagation` evita que un clic DENTRO de la ventana llegue al
       * fondo y la cierre sin querer.
       */}
      <div
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        onClick={(evento) => evento.stopPropagation()}
      >
        {/* ── Cabecera ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{equipo.nombre}</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              <span className="font-mono">{equipo.numero_serie}</span> ·{' '}
              {equipo.categoria}
            </p>
          </div>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-md p-1 text-2xl leading-none text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            ×
          </button>
        </div>

        {/* ── Reservas activas de este equipo ──────────────────────────── */}
        <div className="border-b border-slate-200 p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Reservas activas
          </h3>

          {cargandoReservas ? (
            <p className="text-sm text-slate-500">Cargando reservas…</p>
          ) : reservas.length === 0 ? (
            <p className="text-sm text-slate-500">
              Este equipo no tiene reservas activas.
            </p>
          ) : (
            <ul className="space-y-2">
              {reservas.map((reserva) => (
                <li
                  key={reserva.id}
                  className="flex flex-col gap-2 rounded-md bg-slate-50 p-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-slate-800">
                      {formatearFecha(reserva.fecha_hora_inicio)} →{' '}
                      {formatearFecha(reserva.fecha_hora_fin)}
                    </p>
                    <p className="text-slate-500">{reserva.solicitante_nombre}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => alCancelar(reserva.id)}
                    className="shrink-0 rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50"
                  >
                    Cancelar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Formulario de nueva reserva ──────────────────────────────── */}
        <form onSubmit={alEnviar} className="space-y-4 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            Nueva reserva
          </h3>

          <div>
            <label
              htmlFor="nombre"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Tu nombre
            </label>
            <input
              id="nombre"
              name="solicitante_nombre"
              type="text"
              required
              value={formulario.solicitante_nombre}
              onChange={alEscribir}
              placeholder="Daniel Holder"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <label
              htmlFor="correo"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Tu correo
            </label>
            <input
              id="correo"
              name="solicitante_correo"
              type="email"
              required
              value={formulario.solicitante_correo}
              onChange={alEscribir}
              placeholder="daniel@udea.edu.co"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {/* Las dos fechas: apiladas en celular, lado a lado en pantallas
              más anchas. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="inicio"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Desde
              </label>
              <input
                id="inicio"
                name="fecha_hora_inicio"
                type="datetime-local"
                required
                value={formulario.fecha_hora_inicio}
                onChange={alEscribir}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label
                htmlFor="fin"
                className="mb-1 block text-sm font-medium text-slate-700"
              >
                Hasta
              </label>
              <input
                id="fin"
                name="fecha_hora_fin"
                type="datetime-local"
                required
                value={formulario.fecha_hora_fin}
                onChange={alEscribir}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          {/* ── LA ZONA DE MENSAJES ──────────────────────────────────────
              Aquí aterriza el error 409 traducido, y también los éxitos. */}
          {error && <Aviso tipo="error">{error}</Aviso>}
          {exito && <Aviso tipo="exito">{exito}</Aviso>}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCerrar}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Cerrar
            </button>
            <button
              type="submit"
              // Mientras se envía, el botón queda deshabilitado. Sin esto,
              // pulsar dos veces rápido crearía dos reservas seguidas.
              disabled={enviando}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {enviando ? 'Reservando…' : 'Reservar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
