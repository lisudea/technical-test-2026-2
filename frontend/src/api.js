/**
 * TODAS las llamadas al backend viven en este archivo.
 *
 * ¿Por qué en un solo sitio y no repartidas por los componentes? Porque si
 * cada componente llamara a la API por su cuenta, la dirección del servidor y
 * el manejo de errores quedarían copiados en cinco lugares distintos. El día
 * que cambiara algo habría que acordarse de los cinco. Así se cambia en uno.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TÉRMINOS QUE APARECEN AQUÍ (explicados de una vez)
 * ─────────────────────────────────────────────────────────────────────────
 *
 * • ASÍNCRONO: pedirle datos a un servidor TARDA (puede ser una décima de
 *   segundo o cinco segundos). El programa no puede quedarse congelado
 *   esperando, porque entonces la página dejaría de responder a los clics.
 *   "Asíncrono" significa justamente eso: pedirlo y seguir con otra cosa
 *   mientras llega.
 *
 * • PROMESA (Promise): el "pagaré" que se recibe a cambio. Significa "todavía
 *   no tengo tu respuesta, pero te prometo que llegará, o te aviso si algo
 *   falla".
 *   La analogía: pides una pizza y te dan un número de pedido. No te quedas
 *   plantado en la puerta: sigues con tu vida y atiendes cuando suena el
 *   timbre.
 *
 * • async / await: la forma cómoda de trabajar con promesas.
 *   - `async` delante de una función significa "esta función tarda".
 *   - `await` significa "espera aquí a que llegue la respuesta".
 *   El código se lee de arriba abajo como si fuera normal, pero por debajo NO
 *   bloquea la página: mientras espera, todo lo demás sigue funcionando.
 *
 * • fetch: la función que trae el navegador para hacer peticiones por red.
 *   Tiene una trampa importante, explicada abajo en `pedir()`.
 */

// Dirección a la que se le piden los datos.
//
// import.meta.env es la forma que tiene Vite de exponer las variables de
// entorno. Si no hay ninguna definida, se usa "/api", que es el atajo que
// intercepta el proxy de vite.config.js y reenvía al backend.
const URL_API = import.meta.env.VITE_API_URL || '/api'

/**
 * Error propio que representa "el backend contestó, pero rechazó la petición".
 *
 * ¿Por qué crear un error propio en vez de usar el normal? Porque necesitamos
 * llevar dentro el NÚMERO de la respuesta (404, 409, 422…). Ese número es lo
 * que después permite elegir el mensaje correcto para el usuario, sin tener
 * que adivinar leyendo el texto del error.
 *
 * @property {number} estado - El código HTTP devuelto (404, 409, 422…).
 * @property {string} detalle - La explicación técnica que dio el backend.
 */
export class ErrorApi extends Error {
  constructor(estado, detalle) {
    super(detalle)
    this.name = 'ErrorApi'
    this.estado = estado
    this.detalle = detalle
  }
}

/**
 * Lee la explicación del error que envió el backend.
 *
 * ¡OJO, ESTO TIENE TRAMPA! El backend devuelve el campo "detail" de DOS formas
 * distintas según el tipo de error:
 *
 *   • En un 404 o un 409 → es un TEXTO:
 *       { "detail": "El equipo ya tiene una reserva activa que se cruza..." }
 *
 *   • En un 422 (datos mal escritos) → es una LISTA de objetos, uno por cada
 *     campo que está mal:
 *       { "detail": [ { "loc": [...], "msg": "value is not a valid email..." } ] }
 *
 * Si diéramos por hecho que siempre es un texto, al llegar un 422 la pantalla
 * mostraría literalmente "[object Object]", que no significa nada para nadie.
 * Por eso esta función contempla los dos casos.
 *
 * @param {any} cuerpo - Lo que respondió el backend, ya convertido a objeto.
 * @returns {string} Una explicación en forma de texto, siempre.
 */
function leerDetalle(cuerpo) {
  const detalle = cuerpo?.detail

  // Caso 1: ya es un texto (404, 409). Se devuelve tal cual.
  if (typeof detalle === 'string') return detalle

  // Caso 2: es una lista de problemas (422). Se juntan los mensajes.
  if (Array.isArray(detalle)) {
    return detalle.map((problema) => problema.msg).join('. ')
  }

  // Caso 3: llegó algo inesperado. Mejor un texto genérico que reventar.
  return 'El servidor rechazó la petición.'
}

/**
 * La función por la que pasan TODAS las llamadas. Hace tres cosas:
 * enviar la petición, comprobar si el backend la aceptó, y devolver los datos.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * LA TRAMPA MÁS IMPORTANTE DE TODO EL PROYECTO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `fetch` NO considera un error que el servidor responda 404, 409 o 422.
 *
 * Para `fetch`, "el servidor me contestó" ya cuenta como éxito, aunque la
 * respuesta sea un rechazo rotundo. Solo falla de verdad si NO PUDO HABLAR con
 * el servidor (está apagado, no hay internet).
 *
 * Es decir:
 *
 *     const respuesta = await fetch('/api/reservas', { method: 'POST', ... })
 *     // Si el backend respondió 409, AQUÍ NO PASA NADA. El programa sigue
 *     // tan tranquilo como si todo hubiera ido bien.
 *
 * Si esto se olvida, el programa cree que la reserva se creó, muestra la
 * confirmación al usuario y actualiza la lista... cuando en realidad el
 * backend la rechazó. Es un fallo silencioso y desconcertante.
 *
 * Por eso hay que comprobarlo A MANO con `respuesta.ok`, que vale false para
 * cualquier código de error. Y por eso TODAS las llamadas pasan por aquí: para
 * que sea imposible olvidarlo en alguna.
 *
 * @param {string} ruta - La parte final de la dirección. Ej: "/equipos".
 * @param {object} [opciones] - Método, cabeceras y cuerpo, si hacen falta.
 * @returns {Promise<any>} Los datos que devolvió el backend, ya convertidos.
 * @throws {ErrorApi} Si el backend rechazó la petición (404, 409, 422…).
 * @throws {TypeError} Si no se pudo ni contactar con el servidor.
 */
async function pedir(ruta, opciones = {}) {
  // 1. Enviar la petición y ESPERAR la respuesta.
  //    Si el servidor está apagado, este `await` lanza un error por sí solo
  //    (lo atrapará quien haya llamado a esta función).
  const respuesta = await fetch(`${URL_API}${ruta}`, opciones)

  // 2. Comprobar si el backend ACEPTÓ o RECHAZÓ. (La trampa de arriba.)
  if (!respuesta.ok) {
    // Se intenta leer la explicación que dio. Se envuelve en try/catch porque
    // si la respuesta viniera vacía o rota, al convertirla fallaría, y no
    // queremos que un error tapando otro nos deje sin información.
    let cuerpo = null
    try {
      cuerpo = await respuesta.json()
    } catch {
      cuerpo = null
    }

    throw new ErrorApi(respuesta.status, leerDetalle(cuerpo))
  }

  // 3. Todo bien: convertir la respuesta (que viaja como texto) en datos
  //    utilizables desde JavaScript.
  return respuesta.json()
}

/**
 * Traduce cualquier error a un mensaje que entienda una persona normal.
 *
 * Esta función es el último paso del camino que recorre un error desde el
 * backend hasta la pantalla. Su trabajo es que el usuario NUNCA vea un texto
 * técnico.
 *
 * Fíjate en que además de decir qué pasó, los mensajes dicen QUÉ HACER a
 * continuación, que es lo que de verdad ayuda a quien está atascado.
 *
 * @param {Error} error - El error que se atrapó.
 * @returns {string} Un mensaje claro, en español, listo para mostrar.
 */
export function mensajeAmigable(error) {
  const MENSAJE_SIN_CONEXION =
    'No pudimos conectar con el servidor. Comprueba que el backend esté encendido y vuelve a intentarlo.'

  // Si NO es un ErrorApi, significa que ni siquiera se pudo hablar con el
  // servidor: no hay red, o la dirección no responde en absoluto.
  if (!(error instanceof ErrorApi)) {
    return MENSAJE_SIN_CONEXION
  }

  switch (error.estado) {
    // 502, 503 y 504 son "errores de pasarela": alguien SÍ contestó, pero solo
    // para decir que no pudo alcanzar al servidor de detrás.
    //
    // Este caso es más común de lo que parece en este proyecto: como las
    // llamadas pasan por el proxy de Vite (ver vite.config.js), si el backend
    // está apagado NO se produce un fallo de red —que es lo que uno esperaría—
    // sino que el propio proxy responde 502. Sin esta rama, apagar el backend
    // mostraría "ocurrió un problema inesperado", que no ayuda nada a
    // entender qué pasa ni cómo arreglarlo.
    case 502:
    case 503:
    case 504:
      return MENSAJE_SIN_CONEXION

    case 409:
      // El 409 llega por dos motivos distintos, y conviene distinguirlos
      // porque la solución para el usuario NO es la misma:
      //   - si el horario choca, tiene que elegir otra hora;
      //   - si el equipo está averiado, no hay hora que valga.
      if (error.detalle.includes('no está disponible')) {
        return 'Este equipo no está disponible para préstamo ahora mismo (está en mantenimiento o dañado).'
      }
      return 'Ese horario ya está ocupado. Elige otro o revisa las reservas activas del equipo.'

    case 422:
      return 'Revisa los datos: el correo debe ser válido y la hora de fin posterior a la de inicio.'

    case 404:
      return 'No encontramos ese elemento. Puede que haya cambiado; recarga la página.'

    default:
      return 'Ocurrió un problema inesperado. Inténtalo de nuevo en unos segundos.'
  }
}

// ───────────────────────────────────────────────────────────────────────────
// LAS CUATRO LLAMADAS QUE USA LA APLICACIÓN
// ───────────────────────────────────────────────────────────────────────────

/**
 * Pide una página de equipos al backend, aplicando los filtros indicados.
 *
 * Paso a paso:
 *   1. Construye la lista de parámetros de la dirección (página, tamaño...).
 *   2. Añade los filtros SOLO si tienen valor: mandar "categoria=" vacío haría
 *      que el backend buscara equipos cuya categoría es la cadena vacía, y no
 *      devolvería ninguno.
 *   3. Hace la llamada y devuelve el resultado.
 *
 * @param {object} filtros - { categoria, estado }. Cualquiera puede ir vacío.
 * @param {number} pagina - Qué página pedir. La primera es la 1.
 * @param {number} [tamano=12] - Cuántos equipos por página.
 * @returns {Promise<object>} { items, total, page, size, total_pages }
 */
export async function obtenerEquipos(filtros, pagina, tamano = 12) {
  const parametros = new URLSearchParams({ page: pagina, size: tamano })

  if (filtros.categoria) parametros.set('categoria', filtros.categoria)
  if (filtros.estado) parametros.set('estado', filtros.estado)

  return pedir(`/equipos?${parametros}`)
}

/**
 * Pide TODAS las reservas que están activas ahora mismo.
 *
 * Sirve para saber qué equipos hay que pintar de rojo. El backend no guarda un
 * estado "RESERVADO" (ver docs/spec.md §3), así que se deduce cruzando esta
 * lista con la de equipos.
 *
 * LIMITACIÓN CONOCIDA: se piden 100, que es el máximo que permite el backend
 * por página. Si el laboratorio llegara a tener más de 100 reservas activas a
 * la vez, algunas no se tendrían en cuenta al calcular el color. Para el
 * tamaño real de este laboratorio va muy holgado, y resolverlo del todo
 * obligaría a recorrer varias páginas en cada carga.
 *
 * @returns {Promise<Array>} La lista de reservas activas.
 */
export async function obtenerReservasActivas() {
  const datos = await pedir('/reservas?estado=ACTIVA&size=100')
  return datos.items
}

/**
 * Crea una reserva nueva.
 *
 * @param {object} datos - { equipo_id, solicitante_nombre, solicitante_correo,
 *                           fecha_hora_inicio, fecha_hora_fin }
 * @returns {Promise<object>} La reserva creada.
 * @throws {ErrorApi} 409 si el horario está ocupado o el equipo no está
 *   disponible; 422 si los datos están mal; 404 si el equipo no existe.
 */
export async function crearReserva(datos) {
  return pedir('/reservas', {
    method: 'POST',
    // Esta cabecera le avisa al backend de que lo que va en el cuerpo está
    // escrito en formato JSON. Sin ella, no sabría cómo interpretarlo.
    headers: { 'Content-Type': 'application/json' },
    // JSON.stringify convierte el objeto de JavaScript en texto, que es lo
    // único que se puede enviar por la red.
    body: JSON.stringify(datos),
  })
}

/**
 * Cancela una reserva existente.
 *
 * No la borra: el backend la deja en estado CANCELADA para conservar el
 * historial. Por eso la dirección es ".../cancelar" y no un DELETE.
 *
 * @param {number} reservaId - Identificador de la reserva a cancelar.
 * @returns {Promise<object>} La reserva ya cancelada.
 * @throws {ErrorApi} 404 si no existe; 409 si ya estaba cancelada.
 */
export async function cancelarReserva(reservaId) {
  return pedir(`/reservas/${reservaId}/cancelar`, { method: 'POST' })
}
