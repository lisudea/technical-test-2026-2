/**
 * Punto de entrada de la aplicación.
 *
 * Este es el primer archivo que se ejecuta. Su único trabajo es coger nuestro
 * componente principal (`App`) y "pegarlo" dentro del hueco vacío que hay en
 * `index.html`.
 *
 * Es deliberadamente corto: aquí no hay nada de lógica.
 *
 * TÉRMINOS QUE APARECEN AQUÍ:
 *
 * - **Componente**: una pieza de la pantalla escrita como una función. Como
 *   una pieza de LEGO: se define una vez y se puede usar muchas veces.
 *
 * - **Renderizar**: dibujar un componente en la pantalla. Cuando decimos "React
 *   renderiza App", significa "React calcula cómo se ve App y lo pinta".
 *
 * - **StrictMode**: un modo de ayuda que React activa solo mientras
 *   desarrollamos. Avisa por consola de prácticas que podrían dar problemas.
 *   No aparece en la versión final ni afecta a lo que ve el usuario.
 *   (Efecto llamativo: hace que algunas cosas se ejecuten DOS veces a
 *   propósito, para detectar errores. Es normal, no es un fallo.)
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import './index.css'

// document.getElementById('root') busca en index.html la etiqueta que tiene
// id="root": el hueco vacío donde va toda la aplicación.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
