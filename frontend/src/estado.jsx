/**
 * El "almacén compartido" de la aplicación (Context de React).
 *
 * ─────────────────────────────────────────────────────────────────────────
 * QUÉ PROBLEMA RESUELVE ESTO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * En React, la información viaja de padres a hijos mediante PROPS (los datos
 * que un componente le pasa a otro, como los argumentos de una función). Las
 * props solo van hacia abajo.
 *
 * Pero mira lo que necesitamos:
 *
 *     Tablero                      ← aquí vive la LISTA de equipos
 *      └── ListaEquipos
 *           └── TarjetaEquipo
 *                └── ModalReserva  ← al crear una reserva hay que RECARGAR
 *                                    la lista, que está 3 niveles más arriba
 *
 * Para lograrlo solo con props habría que pasar la función `recargar` desde
 * Tablero hasta ModalReserva atravesando dos componentes que NO la usan para
 * nada: solo la transportan. Eso ensucia los componentes intermedios y se
 * llama "prop drilling" (perforar con props).
 *
 * EL CONTEXT es la solución: un almacén compartido. En vez de pasar el dato de
 * mano en mano, se deja en una repisa común y cualquier componente lo coge
 * directamente, sin importar a qué profundidad esté.
 *
 * La analogía: en vez de pasar el control remoto de persona en persona por
 * toda la fila del sofá, se deja en la mesa del centro y cada uno lo alcanza.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * OTROS TÉRMINOS QUE APARECEN AQUÍ
 * ─────────────────────────────────────────────────────────────────────────
 *
 * • ESTADO (useState): la memoria de un componente. Un valor que, cuando
 *   cambia, hace que React vuelva a dibujar la pantalla automáticamente.
 *   Es la diferencia entre una variable normal (cambia y nadie se entera) y
 *   el estado (cambia y la pantalla se actualiza sola).
 *
 * • HOOK: una función de React cuyo nombre empieza por "use". Le da
 *   "superpoderes" a un componente: `useState` le da memoria, `useEffect` le
 *   permite ejecutar algo cuando ocurre un cambio, `useContext` le permite
 *   leer del almacén compartido.
 *
 * • useEffect: sirve para ejecutar código COMO CONSECUENCIA de algo. Aquí se
 *   usa para "cuando cambie el filtro o la página, vuelve a pedir los datos".
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

import { mensajeAmigable, obtenerEquipos, obtenerReservasActivas } from './api'

// Se crea el almacén. Está vacío hasta que el Proveedor lo llene.
const ContextoDatos = createContext(null)

/**
 * Atajo para que cualquier componente lea del almacén.
 *
 * En vez de escribir `useContext(ContextoDatos)` en cada componente, se
 * escribe `useDatos()`, que además avisa con un error claro si se usa por
 * error fuera del Proveedor (un fallo típico y difícil de diagnosticar).
 *
 * @returns {object} Todo lo que guarda el almacén: datos y acciones.
 */
export function useDatos() {
  const datos = useContext(ContextoDatos)
  if (!datos) {
    throw new Error('useDatos() se usó fuera de <ProveedorDatos>.')
  }
  return datos
}

/**
 * Calcula qué equipos están ocupados EN ESTE MOMENTO.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * POR QUÉ HAY QUE CALCULARLO
 * ─────────────────────────────────────────────────────────────────────────
 *
 * El backend guarda tres estados para cada equipo (DISPONIBLE, MANTENIMIENTO,
 * DAÑADO). NO existe un estado "RESERVADO", y es a propósito: si estuviera
 * guardado, alguien tendría que acordarse de cambiarlo cuando empieza cada
 * reserva y cuando termina. En cuanto se olvidara una vez, el sistema estaría
 * mintiendo.
 *
 * Lo correcto es deducirlo: un equipo está reservado AHORA si tiene alguna
 * reserva activa cuyo horario incluye este preciso instante.
 *
 *              inicio          AHORA           fin
 *                 │              ▼              │
 *                 ├──────────────────────────────┤   ← ocupa: inicio < ahora < fin
 *
 *                 ├──────┤          ▼               ← NO ocupa: ya terminó
 *
 *                        ▼      ├──────────┤        ← NO ocupa: aún no empieza
 *
 * @param {Array} reservas - Las reservas activas que devolvió el backend.
 * @returns {Set<number>} Los identificadores de los equipos ocupados ahora.
 */
function calcularOcupadosAhora(reservas) {
  const ahora = new Date()
  const ocupados = new Set()

  for (const reserva of reservas) {
    // Las fechas llegan como texto ("2026-08-10T09:00:00Z"). Hay que
    // convertirlas a fechas de verdad para poder compararlas.
    const inicio = new Date(reserva.fecha_hora_inicio)
    const fin = new Date(reserva.fecha_hora_fin)

    if (inicio <= ahora && ahora < fin) {
      ocupados.add(reserva.equipo_id)
    }
  }

  return ocupados
}

/**
 * ¿POR QUÉ UN Set Y NO UNA LISTA NORMAL?
 *
 * La pregunta que se hace después, una vez por cada equipo de la pantalla, es
 * "¿está este equipo en el grupo de ocupados?".
 *
 * En una lista habría que recorrerla entera cada vez para averiguarlo. En un
 * Set la respuesta es inmediata, sin recorrer nada. Con 24 equipos la
 * diferencia no se nota, pero es la herramienta correcta para esta pregunta y
 * no cuesta más escribirla.
 */

/**
 * ProveedorDatos — el componente que guarda los datos y los reparte.
 *
 * QUÉ MUESTRA: nada por sí mismo. Es un envoltorio: dibuja lo que tenga
 * dentro, pero les da a todos sus componentes hijos acceso al almacén.
 *
 * QUÉ NECESITA (props):
 *   - children: los componentes que va a envolver. React lo rellena solo con
 *     lo que se escriba entre las etiquetas de apertura y cierre.
 *
 * CÓMO SE USA:
 *     <ProveedorDatos>
 *       <Tablero />     ← Tablero y todos sus hijos podrán usar useDatos()
 *     </ProveedorDatos>
 */
export function ProveedorDatos({ children }) {
  // ── La memoria del componente ────────────────────────────────────────────
  // Cada useState devuelve dos cosas: el valor actual y la función para
  // cambiarlo. Al cambiarlo, React redibuja la pantalla automáticamente.

  const [equipos, setEquipos] = useState([])          // los de la página actual
  const [total, setTotal] = useState(0)                // cuántos hay con el filtro
  const [totalPaginas, setTotalPaginas] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [filtros, setFiltros] = useState({ categoria: '', estado: '' })
  const [ocupadosAhora, setOcupadosAhora] = useState(new Set())
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Pide al backend los equipos y las reservas activas, y guarda el resultado.
   *
   * Paso a paso:
   *   1. Marca que estamos cargando (para que se vea el aviso "cargando…").
   *   2. Lanza LAS DOS peticiones A LA VEZ con Promise.all. Si se hicieran una
   *      detrás de otra, la página tardaría la suma de ambas; lanzándolas
   *      juntas, tarda lo que tarde la más lenta.
   *   3. Si todo llega bien, guarda los datos y calcula qué está ocupado.
   *   4. Si algo falla, guarda un mensaje amigable en vez de reventar.
   *   5. Pase lo que pase, marca que ya no estamos cargando.
   *
   * Está envuelta en useCallback para que no se cree una función nueva en cada
   * dibujado; si no, el useEffect de abajo creería que algo cambió y volvería
   * a pedir los datos sin parar, en un bucle infinito.
   */
  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setError(null)

    try {
      const [respuestaEquipos, reservasActivas] = await Promise.all([
        obtenerEquipos(filtros, pagina),
        obtenerReservasActivas(),
      ])

      setEquipos(respuestaEquipos.items)
      setTotal(respuestaEquipos.total)
      setTotalPaginas(respuestaEquipos.total_pages)
      setOcupadosAhora(calcularOcupadosAhora(reservasActivas))
    } catch (fallo) {
      // Aquí llega tanto "el backend está apagado" como cualquier rechazo.
      // mensajeAmigable() se encarga de convertirlo en algo comprensible.
      setError(mensajeAmigable(fallo))
      setEquipos([])
      setTotal(0)
      setTotalPaginas(0)
    } finally {
      // `finally` se ejecuta SIEMPRE, haya ido bien o mal. Si esto estuviera
      // solo en el camino del éxito, un error dejaría el aviso de "cargando…"
      // girando para siempre.
      setCargando(false)
    }
  }, [filtros, pagina])

  /**
   * Pide los datos al abrir la página y cada vez que cambian los filtros o la
   * página.
   *
   * La lista de la derecha ([cargarDatos]) le dice a React: "vuelve a ejecutar
   * esto solo cuando esto cambie". Y `cargarDatos` cambia justo cuando cambian
   * los filtros o la página, que es exactamente cuando hay que volver a pedir.
   */
  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  /**
   * Cambia un filtro y vuelve a la primera página.
   *
   * Lo de volver a la página 1 no es un capricho: si alguien está en la página
   * 5 y filtra por "Herramientas" (que tiene una sola página), se quedaría
   * mirando una página 5 que ya no existe y vería una lista vacía sin
   * entender por qué.
   *
   * @param {string} nombre - "categoria" o "estado".
   * @param {string} valor - El valor elegido. Vacío significa "todos".
   */
  const cambiarFiltro = useCallback((nombre, valor) => {
    setFiltros((anteriores) => ({ ...anteriores, [nombre]: valor }))
    setPagina(1)
  }, [])

  /** Quita todos los filtros y vuelve al inventario completo. */
  const limpiarFiltros = useCallback(() => {
    setFiltros({ categoria: '', estado: '' })
    setPagina(1)
  }, [])

  // Todo lo que se comparte con el resto de la aplicación.
  const valor = {
    equipos,
    total,
    pagina,
    totalPaginas,
    filtros,
    ocupadosAhora,
    cargando,
    error,
    setPagina,
    cambiarFiltro,
    limpiarFiltros,
    recargar: cargarDatos,
  }

  return <ContextoDatos.Provider value={valor}>{children}</ContextoDatos.Provider>
}
