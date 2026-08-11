import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App'
import { AuthProvider } from './auth/AuthProvider'
import { ToastProvider } from './feedback/ToastProvider'
import { I18nProvider } from './i18n/I18nProvider'
import './styles/global.css'

/**
 * Orden de los proveedores (de fuera hacia dentro):
 *
 *   I18n   -> los avisos necesitan traducir sus textos
 *   Toast  -> la sesion puede avisar de que ha caducado
 *   Auth   -> las paginas consultan quien esta conectado
 *   Router -> las rutas se pintan dentro de todo lo anterior
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </I18nProvider>
  </StrictMode>,
)