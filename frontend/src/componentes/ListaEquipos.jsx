/**
 * ListaEquipos — dibuja la lista completa de equipos y los botones de página.
 *
 * QUÉ MUESTRA, según la situación:
 *   - Si está cargando       → el aviso "Cargando equipos…"
 *   - Si el backend falló     → el aviso de error con botón de reintentar
 *   - Si no hay resultados     → un mensaje amable (no una pantalla vacía)
 *   - Si todo va bien           → la lista de equipos y la paginación
 *
 * QUÉ NECESITA (props):
 *   - onAbrirEquipo: la función que se ejecuta al pulsar el botón de un
 *     equipo. Recibe el equipo pulsado.
 *
 * El resto de datos NO llegan por props: los coge directamente del almacén
 * compartido con useDatos(). Por eso este componente se usa así de simple:
 *
 *     <ListaEquipos onAbrirEquipo={setEquipoElegido} />
 */

import { useDatos } from '../estado'
import Aviso from './Aviso'
import TarjetaEquipo from './TarjetaEquipo'

export default function ListaEquipos({ onAbrirEquipo }) {
  const {
    equipos,
    total,
    pagina,
    totalPaginas,
    ocupadosAhora,
    cargando,
    error,
    setPagina,
    recargar,
  } = useDatos()

  // ── Los tres casos especiales, antes de dibujar la lista ────────────────
  // Se comprueban en este orden a propósito: un error importa más que el
  // "cargando", y ambos importan más que "no hay resultados".

  if (cargando) {
    return <Aviso tipo="cargando">Cargando equipos…</Aviso>
  }

  if (error) {
    // onReintentar hace aparecer el botón que vuelve a pedir los datos, para
    // que el usuario pueda recuperarse sin recargar la página entera.
    return (
      <Aviso tipo="error" onReintentar={recargar}>
        {error}
      </Aviso>
    )
  }

  if (equipos.length === 0) {
    return (
      <Aviso tipo="info">
        No hay equipos que coincidan con esos filtros. Prueba a cambiarlos o a
        limpiarlos.
      </Aviso>
    )
  }

  // ── La lista normal ──────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Encabezado de columnas: SOLO en pantallas medianas o mayores.
          "hidden md:grid" = escondido por defecto, rejilla a partir de 768px.
          En el celular no tiene sentido, porque cada equipo es una tarjeta
          independiente y no hay columnas que encabezar. */}
      <div className="hidden grid-cols-12 gap-4 px-4 text-xs font-semibold uppercase tracking-wide text-slate-400 md:grid">
        <span className="col-span-4">Equipo</span>
        <span className="col-span-3">Código</span>
        <span className="col-span-2">Categoría</span>
        <span className="col-span-2">Estado</span>
      </div>

      {/* La lista. <ul> y <li> porque esto ES una lista: así los lectores de
          pantalla anuncian "lista de 12 elementos" y se puede navegar mejor. */}
      <ul className="space-y-3">
        {/*
          .map() recorre la lista de equipos y devuelve una TarjetaEquipo por
          cada uno. Es la forma de React de decir "repite esto para cada
          elemento".

          La prop `key` es obligatoria y no es un capricho: React la usa para
          saber qué elemento es cuál cuando la lista cambia. Sin ella, al
          filtrar podría reutilizar por error la tarjeta de un equipo para
          mostrar otro distinto.
        */}
        {equipos.map((equipo) => (
          <TarjetaEquipo
            key={equipo.id}
            equipo={equipo}
            estaReservadoAhora={ocupadosAhora.has(equipo.id)}
            onAbrir={() => onAbrirEquipo(equipo)}
          />
        ))}
      </ul>

      {/* Paginación. Solo se dibuja si hay más de una página: si todo cabe en
          una, unos botones siempre desactivados solo estorban. */}
      {totalPaginas > 1 && (
        <nav className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row">
          <p className="text-sm text-slate-500">
            Mostrando {equipos.length} de {total} equipos
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPagina(pagina - 1)}
              // `disabled` desactiva el botón. En la primera página no hay
              // ninguna anterior a la que ir.
              disabled={pagina <= 1}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ‹ Anterior
            </button>

            <span className="text-sm text-slate-600">
              Página {pagina} de {totalPaginas}
            </span>

            <button
              type="button"
              onClick={() => setPagina(pagina + 1)}
              disabled={pagina >= totalPaginas}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Siguiente ›
            </button>
          </div>
        </nav>
      )}
    </div>
  )
}
