import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Equipos from './pages/Equipos';
import Reservas from './pages/Reservas';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      {/* El Navbar estará visible en todas las páginas */}
      <Navbar /> 
      
      {/* Contenedor principal para las rutas */}
      <div style={{ padding: '20px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/reservas" element={<Reservas />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;