/**
 * App — el componente principal, el que monta toda la aplicación.
 *
 * QUÉ MUESTRA: el tablero completo.
 *
 * QUÉ NECESITA (props): nada. Es el componente de más arriba de todos, así que
 * nadie le pasa información.
 *
 * CÓMO SE USA: lo usa `main.jsx`, escribiendo `<App />`.
 *
 * Es deliberadamente corto: aquí no hay lógica, solo el armado. Su único
 * trabajo es envolver el tablero en el almacén compartido.
 *
 * POR QUÉ ESE ENVOLTORIO: `ProveedorDatos` es quien pide los datos al backend
 * y los guarda. Todo lo que esté DENTRO de él (el tablero y sus componentes,
 * por profundos que sean) puede leerlos con `useDatos()`. Si el tablero
 * estuviera fuera, no tendría de dónde sacarlos.
 */

import { ProveedorDatos } from './estado'
import Tablero from './componentes/Tablero'

export default function App() {
  return (
    <ProveedorDatos>
      <Tablero />
    </ProveedorDatos>
  )
}
