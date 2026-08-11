// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, PackageOpen, Boxes, CheckCircle2, Clock } from "lucide-react";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import Filters from "../components/Filters"; 
import EquipmentCard from "../components/EquipmentCard";
import { obtenerEquipos } from "../services/api";
import TopEquipos from "../components/TopEquipos";
import ReservationModal from "../components/ReservationModal";
import Toast from "../components/Toast";

function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [equipos, setEquipos] = useState([]);
  const [estadoCarga, setEstadoCarga] = useState("cargando"); 
  const [categoriasDisponibles, setCategoriasDisponibles] = useState([]);
  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [toasts, setToasts] = useState([]);

  //estados de los filtros
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("");

  // Se ejecuta al inicio Y cada vez que cambian categoria o estadoFiltro
  useEffect(() => {
    cargarEquipos();
  }, [categoria, estadoFiltro]);

  // Se ejecuta solo una vez, para armar la lista de categorías del filtro
    useEffect(() => {
  async function cargarCategorias() {
    try {
      const respuesta = await obtenerEquipos({ page: 1, limit: 100 });
      const categoriasUnicas = [...new Set(respuesta.data.equipos.map((e) => e.categoria))];
      setCategoriasDisponibles(categoriasUnicas);
    } catch (error) {
      console.error(error);
    }
  }
  cargarCategorias();
}, []);
  

  async function cargarEquipos() {
    setEstadoCarga("cargando");
    try {
      const respuesta = await obtenerEquipos({
        page: 1,
        limit: 50,
        categoria: categoria || undefined,
        estado: estadoFiltro || undefined,
      });
      setEquipos(respuesta.data.equipos);
      setEstadoCarga("listo");
    } catch (error) {
      console.error(error);
      setEstadoCarga("error");
    }
  }
  
  function mostrarToast(tipo, titulo, mensaje) {
  const id = Date.now();

  setToasts((prev) => [
    ...prev,
    { id, tipo, titulo, mensaje }
  ]);

  setTimeout(() => cerrarToast(id), 5000);
}

function cerrarToast(id) {
  setToasts((prev) => prev.filter((t) => t.id !== id));
}

function manejarReservaExitosa(mensaje) {
  mostrarToast("exito", "Reserva confirmada", mensaje);
  cargarEquipos();
}

function manejarErrorReserva(titulo, mensaje) {
  mostrarToast("error", titulo, mensaje);
}

  // El buscador por nombre se filtra en el navegador, sin llamar al backend de nuevo
  const equiposFiltrados = equipos.filter((e) =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const total = equipos.length;
  const disponibles = equipos.filter((e) => e.estado === "disponible").length;
  const reservados = equipos.filter((e) => e.estado === "reservado").length;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          usuario={JSON.parse(localStorage.getItem("usuario") || "null")}
          onLogout={() => {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            window.location.href = "/login";
          }}
        />

        <main className="p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <TarjetaResumen icono={Boxes} etiqueta="Total de equipos" valor={total} color="blue" />
            <TarjetaResumen icono={CheckCircle2} etiqueta="Disponibles" valor={disponibles} color="green" />
            <TarjetaResumen icono={Clock} etiqueta="Reservados" valor={reservados} color="red" />
          </div>

          <TopEquipos />

          {}
          <Filters
            busqueda={busqueda}
            onBusquedaChange={setBusqueda}
            categoria={categoria}
            onCategoriaChange={setCategoria}
            estado={estadoFiltro}
            onEstadoChange={setEstadoFiltro}
            categoriasDisponibles={categoriasDisponibles}
          />

          {estadoCarga === "cargando" && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <Loader2 className="animate-spin mb-3" size={28} />
              <p>Cargando equipos...</p>
            </div>
          )}

          {estadoCarga === "error" && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertTriangle className="text-red-400 mb-3" size={28} />
              <p className="text-slate-700 font-medium mb-1">No pudimos cargar los equipos</p>
              <p className="text-slate-400 text-sm mb-4">Verifica tu conexión con el servidor e intenta de nuevo.</p>
              <button
                onClick={cargarEquipos}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Intentar de nuevo
              </button>
            </div>
          )}

          {estadoCarga === "listo" && equiposFiltrados.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-slate-400">
              <PackageOpen className="mb-3" size={28} />
              <p>No hay equipos disponibles.</p>
            </div>
          )}

          {estadoCarga === "listo" && equiposFiltrados.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {equiposFiltrados.map((equipo) => (
                <EquipmentCard key={equipo.id} equipo={equipo} onReservar={setEquipoSeleccionado} />
              ))}
            </div>
          )}
        </main>

         {equipoSeleccionado && (
          <ReservationModal
            equipo={equipoSeleccionado}
            onClose={() => setEquipoSeleccionado(null)}
            onExito={manejarReservaExitosa}
            onError={manejarErrorReserva}
          />
        )}

        <Toast
          toasts={toasts}
          onClose={cerrarToast}
        />

      </div>
    </div>
  );
}

function TarjetaResumen({ icono: Icono, etiqueta, valor, color }) {
  const estilos = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${estilos[color]}`}>
        <Icono size={20} />
      </div>
      <div>
        <p className="text-2xl font-semibold text-slate-800">{valor}</p>
        <p className="text-sm text-slate-500">{etiqueta}</p>
      </div>
    </div>
  );
}

export default Dashboard;