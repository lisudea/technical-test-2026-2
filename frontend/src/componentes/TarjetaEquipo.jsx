/**
 * TarjetaEquipo — dibuja UN equipo del laboratorio con su indicador de color.
 *
 * QUÉ MUESTRA: una línea (en computador) o una tarjeta (en celular) con el
 * punto de color del estado, el nombre del equipo, su código, su categoría y
 * un botón para abrir el panel de reservas.
 *
 * QUÉ NECESITA (props):
 *   - equipo: el objeto que devolvió el backend
 *             { id, nombre, numero_serie, categoria, estado }
 *   - estaReservadoAhora: true/false. Si tiene una reserva vigente en este
 *                         momento. Lo calcula el almacén compartido, no este
 *                         componente.
 *   - onAbrir: la función que se ejecuta al pulsar el botón.
 *
 * CÓMO SE USA:
 *     <TarjetaEquipo
 *       equipo={unEquipo}
 *       estaReservadoAhora={true}
 *       onAbrir={() => setEquipoElegido(unEquipo)}
 *     />
 *
 * ES UN "MOLDE": se escribe una vez y se usa 12 veces para dibujar los 12
 * equipos de la página, cada vez con un equipo distinto.
 */

/**
 * Decide de qué color se pinta un equipo.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * EL ORDEN IMPORTA. Gana la primera condición que se cumpla:
 *
 *    1. ¿está en MANTENIMIENTO?      → ⚪ Gris
 *    2. ¿está DAÑADO?                 → 🟠 Ámbar
 *    3. ¿tiene reserva AHORA MISMO?    → 🔴 Rojo
 *    4. en cualquier otro caso          → 🟢 Verde
 *
 * Por qué el estado físico manda sobre las reservas: si un equipo se rompió,
 * da igual que alguien lo hubiera reservado antes. Pintarlo de rojo daría a
 * entender que se lo llevó una persona, cuando la realidad es que está
 * averiado en un cajón. La información útil es que está roto.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * @param {object} equipo - El equipo, con su campo `estado`.
 * @param {boolean} reservadoAhora - Si tiene una reserva vigente ahora.
 * @returns {object} Las clases de color, la etiqueta y si se puede reservar.
 */
export function calcularEstadoVisual(equipo, reservadoAhora) {
  if (equipo.estado === 'MANTENIMIENTO') {
    return {
      punto: 'bg-slate-400',
      etiqueta: 'En mantenimiento',
      insignia: 'bg-slate-100 text-slate-700 border-slate-300',
      sePuedeReservar: false,
    }
  }

  if (equipo.estado === 'DAÑADO') {
    return {
      punto: 'bg-amber-500',
      etiqueta: 'Dañado',
      insignia: 'bg-amber-50 text-amber-800 border-amber-300',
      sePuedeReservar: false,
    }
  }

  if (reservadoAhora) {
    return {
      punto: 'bg-red-500',
      etiqueta: 'Reservado ahora',
      insignia: 'bg-red-50 text-red-800 border-red-300',
      // Sí se puede reservar: está ocupado AHORA, pero puede estar libre más
      // tarde. El panel deja pedir otra franja horaria.
      sePuedeReservar: true,
    }
  }

  return {
    punto: 'bg-green-500',
    etiqueta: 'Disponible',
    insignia: 'bg-green-50 text-green-800 border-green-300',
    sePuedeReservar: true,
  }
}

export default function TarjetaEquipo({ equipo, estaReservadoAhora, onAbrir }) {
  const visual = calcularEstadoVisual(equipo, estaReservadoAhora)

  return (
    /*
     * LAS CLASES DE TAILWIND, EXPLICADAS:
     *
     *   grid grid-cols-1     → en celular, todo en una columna (apilado)
     *   md:grid-cols-12      → a partir de 768px, una rejilla de 12 columnas
     *                          donde cada dato ocupa su sitio, como una tabla
     *
     * El prefijo "md:" significa "a partir de pantalla mediana". Sin prefijo,
     * la clase vale para TODOS los tamaños. Por eso se escribe primero cómo se
     * ve en celular y luego qué cambia en pantallas grandes.
     *
     * Así el MISMO elemento es una tarjeta en el móvil y una fila en el
     * computador, sin duplicar el contenido.
     */
    <li className="grid grid-cols-1 items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md md:grid-cols-12 md:gap-4">
      {/* Punto de color + nombre */}
      <div className="flex items-center gap-3 md:col-span-4">
        <span
          className={`size-3 shrink-0 rounded-full ${visual.punto}`}
          // aria-hidden esconde el punto de los lectores de pantalla, porque
          // el color por sí solo no dice nada a quien no lo ve. La información
          // real va en la insignia de texto de más abajo.
          aria-hidden="true"
        />
        <p className="font-semibold text-slate-800">{equipo.nombre}</p>
      </div>

      {/* Código del equipo. font-mono lo pone en letra de máquina de escribir,
          que se lee mejor para códigos como ARD-UNO-001. */}
      <p className="font-mono text-sm text-slate-500 md:col-span-3">
        {equipo.numero_serie}
      </p>

      <p className="text-sm text-slate-600 md:col-span-2">{equipo.categoria}</p>

      {/* Insignia de texto con el estado. Es lo que hace que la información no
          dependa SOLO del color: alguien daltónico lee "Reservado ahora". */}
      <div className="md:col-span-2">
        <span
          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${visual.insignia}`}
        >
          {visual.etiqueta}
        </span>
      </div>

      <div className="md:col-span-1 md:justify-self-end">
        <button
          type="button"
          onClick={onAbrir}
          className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700 md:w-auto"
        >
          {visual.sePuedeReservar ? 'Reservar' : 'Ver'}
        </button>
      </div>
    </li>
  )
}
