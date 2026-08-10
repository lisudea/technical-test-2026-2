
import { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";

function App() {
  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [equipoSeleccionado, setEquipoSeleccionado] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [formulario, setFormulario] = useState({
    usuario_nombre: "",
    usuario_correo: "",
    fecha_inicio: "",
    fecha_fin: "",
  });

  const [mensaje, setMensaje] = useState("");

  const cargarEquipos = async () => {
    try {
      setCargando(true);
      setError("");

      const respuesta = await fetch(`${API_URL}/equipos/`);

      if (!respuesta.ok) {
        throw new Error();
      }

      const datos = await respuesta.json();
      setEquipos(datos);
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEquipos();
  }, []);

  const categorias = [
    ...new Set(equipos.map((equipo) => equipo.categoria)),
  ];

  const equiposFiltrados = equipos.filter((equipo) => {
    const coincideBusqueda =
      equipo.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      equipo.numero_serie.toLowerCase().includes(busqueda.toLowerCase());

    const coincideCategoria =
      categoria === "" || equipo.categoria === categoria;

    return coincideBusqueda && coincideCategoria;
  });

  const obtenerClaseEstado = (estado) => {
    switch (estado.toLowerCase()) {
      case "disponible":
        return "bg-success";
      case "reservado":
        return "bg-danger";
      case "mantenimiento":
        return "bg-secondary";
      default:
        return "bg-warning text-dark";
    }
  };

  const abrirFormulario = (equipo) => {
    setEquipoSeleccionado(equipo);
    setMostrarFormulario(true);
    setMensaje("");

    setFormulario({
      usuario_nombre: "",
      usuario_correo: "",
      fecha_inicio: "",
      fecha_fin: "",
    });
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEquipoSeleccionado(null);
  };

  const manejarCambio = (e) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const crearReserva = async (e) => {
    e.preventDefault();

    setMensaje("");

    try {
      const respuesta = await fetch(`${API_URL}/reservas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          usuario_nombre: formulario.usuario_nombre,
          usuario_correo: formulario.usuario_correo,
          equipo_id: equipoSeleccionado.id,
          fecha_inicio: formulario.fecha_inicio,
          fecha_fin: formulario.fecha_fin,
        }),
      });

      const datos = await respuesta.json();

      if (respuesta.status === 409) {
        setMensaje(
          "❌ Este equipo ya está reservado en ese horario."
        );
        return;
      }

      if (!respuesta.ok) {
        setMensaje(
          datos.detail || "No fue posible crear la reserva."
        );
        return;
      }

      setMensaje("✅ Reserva creada correctamente.");

      setTimeout(() => {
        cerrarFormulario();
      }, 1500);
    } catch {
      setMensaje("❌ No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="min-vh-100 bg-light">

      <nav className="navbar navbar-dark bg-dark shadow-sm">
        <div className="container">
          <span className="navbar-brand fw-bold">
            Laboratorio Integrado de Sistemas
          </span>
        </div>
      </nav>

      <main className="container py-4">

        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">

          <div>
            <h1 className="fw-bold mb-1">
              Dashboard de Recursos
            </h1>

            <p className="text-muted mb-0">
              Monitoreo y reserva de equipos del laboratorio
            </p>
          </div>

          <button
            className="btn btn-outline-primary"
            onClick={cargarEquipos}
          >
            ↻ Actualizar
          </button>

        </div>

        {error && (
          <div className="alert alert-danger">
            {error}
          </div>
        )}

        <div className="card shadow-sm mb-4">

          <div className="card-body">

            <div className="row g-3">

              <div className="col-md-8">

                <label className="form-label fw-semibold">
                  Buscar equipo
                </label>

                <input
                  type="text"
                  className="form-control"
                  placeholder="Nombre o número de serie..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(e.target.value)
                  }
                />

              </div>

              <div className="col-md-4">

                <label className="form-label fw-semibold">
                  Categoría
                </label>

                <select
                  className="form-select"
                  value={categoria}
                  onChange={(e) =>
                    setCategoria(e.target.value)
                  }
                >

                  <option value="">
                    Todas las categorías
                  </option>

                  {categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}

                </select>

              </div>

            </div>

          </div>

        </div>

        {cargando ? (

          <div className="text-center py-5">

            <div
              className="spinner-border text-primary"
              role="status"
            >
              <span className="visually-hidden">
                Cargando...
              </span>
            </div>

            <p className="mt-3 text-muted">
              Cargando equipos...
            </p>

          </div>

        ) : equiposFiltrados.length === 0 ? (

          <div className="alert alert-info">
            No se encontraron equipos.
          </div>

        ) : (

          <div className="row g-4">

            {equiposFiltrados.map((equipo) => (

              <div
                className="col-12 col-md-6 col-lg-4"
                key={equipo.id}
              >

                <div className="card h-100 shadow-sm equipo-card">

                  <div className="card-body">

                    <div className="d-flex justify-content-between align-items-start mb-3">

                      <h5 className="card-title fw-bold mb-0">
                        {equipo.nombre}
                      </h5>

                      <span
                        className={`badge ${obtenerClaseEstado(
                          equipo.estado
                        )}`}
                      >
                        {equipo.estado}
                      </span>

                    </div>

                    <p className="text-muted mb-2">
                      <strong>Categoría:</strong>{" "}
                      {equipo.categoria}
                    </p>

                    <p className="text-muted mb-3">
                      <strong>N.º de serie:</strong>{" "}
                      {equipo.numero_serie}
                    </p>

                    {equipo.estado.toLowerCase() ===
                      "disponible" && (

                      <button
                        className="btn btn-primary w-100"
                        onClick={() =>
                          abrirFormulario(equipo)
                        }
                      >
                        Reservar equipo
                      </button>

                    )}

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </main>

      {mostrarFormulario && (

        <div
          className="modal d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content">

              <div className="modal-header">

                <h5 className="modal-title">
                  Reservar {equipoSeleccionado.nombre}
                </h5>

                <button
                  type="button"
                  className="btn-close"
                  onClick={cerrarFormulario}
                />

              </div>

              <form onSubmit={crearReserva}>

                <div className="modal-body">

                  {mensaje && (
                    <div className="alert alert-info">
                      {mensaje}
                    </div>
                  )}

                  <div className="mb-3">

                    <label className="form-label">
                      Nombre
                    </label>

                    <input
                      type="text"
                      name="usuario_nombre"
                      className="form-control"
                      required
                      value={formulario.usuario_nombre}
                      onChange={manejarCambio}
                    />

                  </div>

                  <div className="mb-3">

                    <label className="form-label">
                      Correo
                    </label>

                    <input
                      type="email"
                      name="usuario_correo"
                      className="form-control"
                      required
                      value={formulario.usuario_correo}
                      onChange={manejarCambio}
                    />

                  </div>

                  <div className="mb-3">

                    <label className="form-label">
                      Fecha y hora de inicio
                    </label>

                    <input
                      type="datetime-local"
                      name="fecha_inicio"
                      className="form-control"
                      required
                      value={formulario.fecha_inicio}
                      onChange={manejarCambio}
                    />

                  </div>

                  <div className="mb-3">

                    <label className="form-label">
                      Fecha y hora de fin
                    </label>

                    <input
                      type="datetime-local"
                      name="fecha_fin"
                      className="form-control"
                      required
                      value={formulario.fecha_fin}
                      onChange={manejarCambio}
                    />

                  </div>

                </div>

                <div className="modal-footer">

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cerrarFormulario}
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                  >
                    Confirmar reserva
                  </button>

                </div>

              </form>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;

