/**
 * PanelFiltros — los desplegables para filtrar el inventario.
 *
 * QUÉ MUESTRA: dos desplegables (categoría y estado) y un botón para limpiar
 * los filtros, que solo aparece si hay alguno puesto.
 *
 * QUÉ NECESITA (props): nada. Lee los filtros actuales del almacén compartido
 * y usa sus funciones para cambiarlos.
 *
 * CÓMO SE USA:
 *     <PanelFiltros />
 *
 * CÓMO CUMPLE EL REQUISITO DE "SIN RECARGAR LA PÁGINA":
 * Al elegir una opción NO se envía un formulario ni se navega a otra
 * dirección. Solo se cambia un dato guardado en memoria; React se da cuenta,
 * vuelve a pedir los datos al backend y redibuja la lista. La página nunca
 * parpadea ni se recarga: es lo que hace que se sienta instantáneo.
 */

import { useDatos } from '../estado'

/**
 * Las categorías que se ofrecen en el desplegable.
 *
 * ¿POR QUÉ ESTÁN ESCRITAS AQUÍ Y NO SE PIDEN AL BACKEND?
 *
 * Porque el backend no tiene una operación para listar las categorías que
 * existen: la categoría es texto libre (fue una decisión del Reto 2, para que
 * el laboratorio pueda inventar categorías nuevas sin tocar el código).
 *
 * La alternativa sería pedir los 24 equipos y sacar sus categorías, pero eso
 * solo daría las de la página actual, o exigiría una llamada extra a cada
 * carga para algo que cambia una vez al año.
 *
 * Esta lista corresponde al inventario real del laboratorio. Si un día se
 * añade una categoría nueva, se añade también aquí una línea.
 */
const CATEGORIAS = [
  'Microcontroladores',
  'Computadores',
  'Prototipado',
  'Cables',
  'Herramientas',
]

/**
 * Los estados que el backend admite como filtro.
 *
 * Ojo: aquí NO aparece "Reservado". Ese estado no existe en el backend, lo
 * calcula esta aplicación mirando las reservas (ver docs/spec.md §3). Como el
 * backend no lo conoce, tampoco puede filtrar por él.
 */
const ESTADOS = [
  { valor: 'DISPONIBLE', texto: 'Disponible' },
  { valor: 'MANTENIMIENTO', texto: 'En mantenimiento' },
  { valor: 'DAÑADO', texto: 'Dañado' },
]

export default function PanelFiltros() {
  const { filtros, cambiarFiltro, limpiarFiltros } = useDatos()

  // ¿Hay algún filtro puesto? Sirve para mostrar u ocultar el botón de limpiar.
  const hayFiltros = filtros.categoria !== '' || filtros.estado !== ''

  return (
    /*
     * "flex flex-col" apila los elementos en vertical (celular).
     * "sm:flex-row" los pone en horizontal a partir de 640px.
     *
     * Por eso en el móvil los desplegables salen uno debajo de otro y ocupan
     * todo el ancho (cómodos de tocar con el dedo), y en el computador salen
     * en una sola fila.
     */
    <section className="flex flex-col gap-3 rounded-lg bg-white p-4 shadow-sm sm:flex-row sm:items-end">
      {/* ── Filtro por categoría ────────────────────────────────────────── */}
      <div className="flex-1">
        <label
          htmlFor="filtro-categoria"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Categoría
        </label>
        <select
          id="filtro-categoria"
          /*
           * Esto es un "componente controlado": el valor del desplegable no lo
           * decide el navegador por su cuenta, sino nuestro dato `filtros`.
           *
           * value  → lo que se muestra seleccionado
           * onChange → qué hacer cuando la persona elige otra cosa
           *
           * La ventaja es que el dato guardado y lo que se ve en pantalla
           * NUNCA pueden estar en desacuerdo: son lo mismo.
           */
          value={filtros.categoria}
          onChange={(evento) => cambiarFiltro('categoria', evento.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {/* Valor vacío = "no filtrar por categoría" */}
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {categoria}
            </option>
          ))}
        </select>
      </div>

      {/* ── Filtro por estado ───────────────────────────────────────────── */}
      <div className="flex-1">
        <label
          htmlFor="filtro-estado"
          className="mb-1 block text-sm font-medium text-slate-700"
        >
          Estado
        </label>
        <select
          id="filtro-estado"
          value={filtros.estado}
          onChange={(evento) => cambiarFiltro('estado', evento.target.value)}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map((estado) => (
            <option key={estado.valor} value={estado.valor}>
              {estado.texto}
            </option>
          ))}
        </select>
      </div>

      {/* ── Botón de limpiar ────────────────────────────────────────────── */}
      {/* Solo aparece si hay filtros puestos: un botón que no hace nada solo
          estorba y confunde. */}
      {hayFiltros && (
        <button
          type="button"
          onClick={limpiarFiltros}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Limpiar filtros
        </button>
      )}
    </section>
  )
}
