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
      </Route>
    </Routes>
  )
}
