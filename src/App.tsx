import { Route, Routes } from 'react-router-dom'
import Layout from './componentes/Layout'
import Landing from './paginas/Landing'
import Dashboard from './paginas/Dashboard'
import Reservas from './paginas/Reservas'
import Login from './paginas/Login'
import Registro from './paginas/Registro'
import OlvideContrasena from './paginas/OlvideContrasena'
import RestablecerContrasena from './paginas/RestablecerContrasena'
import Perfil from './paginas/Perfil'
import Admin from './paginas/Admin'
import MiLis from './paginas/MiLis'
import Foro from './paginas/Foro'
import ForoDetalle from './paginas/ForoDetalle'
import JuegosHub from './paginas/JuegosHub'
import Juego from './paginas/Juego'
import CablearRed from './paginas/CablearRed'
import SimuladorCarrera from './paginas/SimuladorCarrera'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Landing />} />
        <Route path="tablero" element={<Dashboard />} />
        <Route path="reservas" element={<Reservas />} />
        <Route path="login" element={<Login />} />
        <Route path="registro" element={<Registro />} />
        <Route path="olvide-contrasena" element={<OlvideContrasena />} />
        <Route path="restablecer-contrasena" element={<RestablecerContrasena />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="admin" element={<Admin />} />
        <Route path="lis" element={<MiLis />} />
        <Route path="foro" element={<Foro />} />
        <Route path="foro/:id" element={<ForoDetalle />} />
        <Route path="juegos" element={<JuegosHub />} />
        <Route path="juegos/memoria" element={<Juego />} />
        <Route path="juegos/red" element={<CablearRed />} />
        <Route path="juegos/carrera" element={<SimuladorCarrera />} />
      </Route>
    </Routes>
  )
}
