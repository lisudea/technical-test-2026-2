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

// Dirección donde corre la API del Reto 2.
const BACKEND = 'http://localhost:8000'

export default defineConfig({
  plugins: [
    react(),      // Permite escribir componentes de React (la sintaxis tipo HTML)
    tailwindcss() // Procesa las clases de Tailwind y genera los estilos
  ],

  server: {
    /**
     * EL PUENTE HACIA EL BACKEND (esto resuelve un problema real).
     *
     * EL PROBLEMA: los navegadores tienen una regla de seguridad llamada CORS
     * que impide que una página cargada desde una dirección llame a un
     * servidor de OTRA dirección, salvo que ese servidor lo autorice
     * explícitamente.
     *
     * Nuestra página vive en  localhost:5173  (este servidor de Vite)
     * y la API vive en        localhost:8000  (el backend).
     * Son direcciones distintas, así que el navegador bloquearía TODAS las
     * llamadas, y el backend del Reto 2 no tiene esa autorización puesta.
     *
     * LA SOLUCIÓN: este "proxy". Le decimos a Vite que todo lo que empiece por
     * /api lo reenvíe él mismo al backend:
     *
     *    SIN proxy (bloqueado)          CON proxy (funciona)
     *    ─────────────────────          ────────────────────
     *    navegador ──✗──► :8000         navegador ──► :5173 ──► :8000
     *              CORS                        (misma dirección)  (lo reenvía
     *                                                              Vite, que no
     *                                                              es un navegador
     *                                                              y no aplica CORS)
     *
     * Para el navegador, TODO viene de localhost:5173. Como es la misma
     * dirección de la que se descargó la página, no hay nada que bloquear.
     *
     * Ventaja añadida: esto es solo configuración del frontend, así que NO hay
     * que modificar el backend del Reto 2, que ya está terminado y entregado.
     */
    proxy: {
      '/api': {
        target: BACKEND,
        changeOrigin: true,
        // El backend NO conoce el prefijo /api: sus rutas son /equipos,
        // /reservas, etc. Así que se lo quitamos antes de reenviar:
        //    el navegador pide  /api/equipos
        //    Vite reenvía a     http://localhost:8000/equipos
        rewrite: (ruta) => ruta.replace(/^\/api/, ''),
      },
    },
  },
})
