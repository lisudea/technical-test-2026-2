import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * El backend corre en :8080 y el frontend en :5173, que son origenes
 * distintos. Aunque la API ya declara CORS para http://localhost:5173, en
 * desarrollo redirigimos las llamadas a traves del servidor de Vite:
 *
 *   navegador -> localhost:5173/api/...  (mismo origen, sin CORS)
 *                       |
 *                       v
 *                 localhost:8080/api/...
 *
 * Ventajas: no hay peticiones preflight, las cookies de sesion de OAuth2
 * viajan sin problemas y un cambio de puerto en el backend se arregla aqui,
 * en un solo sitio.
 *
 * Para apuntar directamente al backend (o a uno desplegado), define
 * VITE_API_BASE_URL en el archivo .env y el proxy deja de usarse.
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/oauth2': { target: 'http://localhost:8080', changeOrigin: true },
      '/login': { target: 'http://localhost:8080', changeOrigin: true },
    },
  },
})