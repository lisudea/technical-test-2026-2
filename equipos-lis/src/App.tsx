import { BrowserRouter, Route, Routes } from 'react-router-dom'
import LanguageProvider from './i18n/LanguageProvider'
import Navbar from './components/layout/Navbar'
import Footer from './components/layout/Footer'
import EquiposPage from './pages/EquiposPage'
import ReservasPage from './pages/ReservasPage'

// El componente App es el punto de entrada principal de la aplicación. 
// Configura el proveedor de idioma, el enrutamiento y la estructura general de la interfaz
//  de usuario, incluyendo la barra de navegación y el pie de página. Renderiza las páginas 
//  de equipos y reservas según la ruta seleccionada.
function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="app-shell">
          <Navbar />
          <main className="app-main">
            <Routes>
              <Route path="/" element={<EquiposPage />} />
              <Route path="/reservas" element={<ReservasPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
