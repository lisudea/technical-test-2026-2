import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Equipos from "./pages/Equipos";
import Reservas from "./pages/Reservas";
import Estadisticas from "./pages/Estadisticas";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="equipos" element={<Equipos />} />
        <Route path="reservas" element={<Reservas />} />
        <Route path="estadisticas" element={<Estadisticas />} />
      </Route>
    </Routes>
  );
}
