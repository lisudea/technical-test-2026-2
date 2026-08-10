/**
 * Aviso — un recuadro de color con un mensaje para el usuario.
 *
 * QUÉ MUESTRA: una caja con un icono y un texto, en el color que corresponda
 * al tipo de aviso (rojo para errores, verde para éxitos, azul para "cargando").
 *
 * QUÉ NECESITA (props):
 *   - tipo: "error" | "exito" | "cargando" | "info". Decide el color y el icono.
 *   - children: el texto que se muestra dentro.
 *   - onReintentar (opcional): si se pasa una función, aparece un botón
 *     "Reintentar" que la ejecuta al pulsarlo.
 *
 * CÓMO SE USA:
 *     <Aviso tipo="error">No pudimos conectar con el servidor.</Aviso>
 *     <Aviso tipo="cargando">Cargando equipos…</Aviso>
 *     <Aviso tipo="error" onReintentar={cargarDatos}>Falló la carga.</Aviso>
 *
 * POR QUÉ EXISTE: los mensajes aparecen en cuatro sitios distintos (el
 * tablero, el panel de reserva, la lista vacía...). Tenerlo en un componente
 * hace que todos se vean igual y que cambiar su aspecto sea tocar un archivo.
 */

// Los estilos de cada tipo, en un objeto en vez de encadenar "if".
// Es más fácil de leer y de ampliar: añadir un tipo nuevo es añadir una línea.
const ESTILOS = {
  error: {
    caja: 'bg-red-50 border-red-200 text-red-800',
    icono: '⚠️',
  },
  exito: {
    caja: 'bg-green-50 border-green-200 text-green-800',
    icono: '✅',
  },
  cargando: {
    caja: 'bg-blue-50 border-blue-200 text-blue-800',
    icono: '⏳',
  },
  info: {
    caja: 'bg-slate-50 border-slate-200 text-slate-700',
    icono: 'ℹ️',
  },
}

export default function Aviso({ tipo = 'info', children, onReintentar }) {
  const estilo = ESTILOS[tipo] ?? ESTILOS.info

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${estilo.caja}`}
      // role="alert" hace que los lectores de pantalla anuncien el mensaje en
      // cuanto aparece, en vez de que una persona ciega se lo pierda.
      role="alert"
    >
      <p className="flex items-start gap-2 text-sm">
        <span aria-hidden="true">{estilo.icono}</span>
        <span>{children}</span>
      </p>

      {/* El botón solo se dibuja si nos han pasado una función que ejecutar.
          En JSX, `condicion && <algo/>` significa "si se cumple, dibuja esto". */}
      {onReintentar && (
        <button
          type="button"
          onClick={onReintentar}
          className="shrink-0 rounded-md border border-current px-3 py-1.5 text-sm font-medium transition hover:bg-white/60"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}
