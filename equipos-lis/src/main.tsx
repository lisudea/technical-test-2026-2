import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../tokens.css'
import './styles/global.css'
import App from './App.tsx'
// Este archivo es el punto de entrada principal de la aplicación. Configura el entorno
//  de React en modo estricto y renderiza el componente App dentro del contenedor raíz 
// del DOM. También importa los estilos globales y las variables CSS definidas en tokens.css
//  para asegurar la consistencia visual en toda la aplicación.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
