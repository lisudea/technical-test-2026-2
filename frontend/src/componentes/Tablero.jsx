/**
 * Tablero — la pantalla principal de la aplicación.
 *
 * QUÉ MUESTRA, de arriba abajo:
 *   1. La cabecera con el título y cuántos equipos se están viendo.
 *   2. El panel de filtros.
 *   3. La leyenda que explica qué significa cada color.
 *   4. La lista de equipos.
 *   5. El panel emergente de reservas, solo si hay un equipo seleccionado.
 *
 * QUÉ NECESITA (props): nada. Coge todo del almacén compartido.
 *
 * CÓMO SE USA:
 *     <ProveedorDatos>
 *       <Tablero />
 *     </ProveedorDatos>
 *
 * (Tiene que ir dentro de ProveedorDatos, porque usa useDatos() por debajo.)
 */

import { useState } from 'react'

import { useDatos } from '../estado'
import ListaEquipos from './ListaEquipos'
import PanelFiltros from './PanelFiltros'

/** Los cuatro colores y qué significan, para dibujar la leyenda. */
const LEYENDA = [
  { color: 'bg-green-500', texto: 'Disponible' },
  { color: 'bg-red-500', texto: 'Reservado ahora' },
  { color: 'bg-slate-400', texto: 'En mantenimiento' },
  { color: 'bg-amber-500', texto: 'Dañado' },
]

export default function Tablero() {
  const { total, cargando } = useDatos()

  /*
   * Qué equipo tiene abierto su panel de reservas.
   *
   * `null` significa "ninguno", y entonces el panel no se dibuja. Cuando vale
   * un equipo, el panel aparece mostrando ese equipo.
   *
   * Este dato vive AQUÍ y no en el almacén compartido porque solo lo necesitan
   * este componente y el panel: no hace falta que esté disponible para toda la
   * aplicación. Regla general: al almacén compartido solo va lo que necesitan
   * componentes lejanos entre sí.
   */
  const [equipoElegido, setEquipoElegido] = useState(null)

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      {/* ── Cabecera ────────────────────────────────────────────────────── */}
      <header className="mb-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              LIS · Monitoreo de Equipos
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Inventario y reservas del Laboratorio Integrado de Sistemas
            </p>
          </div>

          {/* El contador. Mientras carga se muestra un guion en vez del número
              anterior, que estaría desactualizado y confundiría. */}
          <p className="text-sm font-medium text-slate-600">
            {cargando ? '…' : `${total} equipo${total === 1 ? '' : 's'}`}
          </p>
        </div>
      </header>

      {/* ── Filtros ─────────────────────────────────────────────────────── */}
      <PanelFiltros />

      {/* ── Leyenda de colores ──────────────────────────────────────────── */}
      <div className="my-5 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
        {LEYENDA.map((elemento) => (
          <span key={elemento.texto} className="flex items-center gap-2">
            <span
              className={`size-3 rounded-full ${elemento.color}`}
              aria-hidden="true"
            />
            {elemento.texto}
          </span>
        ))}
      </div>

      {/* ── La lista ────────────────────────────────────────────────────── */}
      <ListaEquipos onAbrirEquipo={setEquipoElegido} />

      {/* El panel emergente de reservas se añade en la tarea T-08. */}
    </div>
  )
}
