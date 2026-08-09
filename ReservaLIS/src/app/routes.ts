import { createBrowserRouter } from "react-router";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import EquipoDetalle from "@/pages/EquipoDetalle";
import Reservas from "@/pages/Reservas";
import Login from "@/pages/Login";
import Admin from "@/pages/Admin";
import Estadisticas from "@/pages/Estadisticas";
import NotFound from "@/pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "equipos/:id", Component: EquipoDetalle },
      { path: "reservas", Component: Reservas },
      { path: "login", Component: Login },
      { path: "admin", Component: Admin },
      { path: "estadisticas", Component: Estadisticas },
      { path: "*", Component: NotFound },
    ],
  },
]);
