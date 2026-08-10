/**
 * Configuración de Vite.
 *
 * Vite es la herramienta que:
 *   - en desarrollo, levanta el servidor local y actualiza el navegador al
 *     instante cuando guardas un archivo (`npm run dev`);
 *   - al terminar, empaqueta todo en archivos optimizados (`npm run build`).
 *
 * Este archivo le dice dos cosas: qué complementos usar y cómo hablar con el
 * backend.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),      // Permite escribir componentes de React (la sintaxis tipo HTML)
    tailwindcss() // Procesa las clases de Tailwind y genera los estilos
  ],
})
