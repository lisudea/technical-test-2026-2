import React, { useEffect, useState } from 'react';
import API from './api';

// Valores usados en los select. Son los mismos enums que espera el backend.
const categorias = ['MICROCONTROLADORES', 'VR', 'REDES', 'COMPUTADORES'];
const estados = ['BUENO', 'REGULAR', 'MALO'];

function App() {
  // tab indica cuál de las cuatro vistas se muestra en pantalla.
  const [tab, setTab] = useState('equipos');
  const [mensaje, setMensaje] = useState(null);

  // EQUIPOS
  const [equipos, setEquipos] = useState([]);
  const [equiposReserva, setEquiposReserva] = useState([]);
  const [pagina, setPagina] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [nuevoEquipo, setNuevoEquipo] = useState({
    nombre: '',
    numSerie: '',
    categoriaEquipo: 'COMPUTADORES',
    estadoEquipo: 'BUENO'
  });

  // ESTUDIANTES
  const [estudiantes, setEstudiantes] = useState([]);
  const [nuevoEstudiante, setNuevoEstudiante] = useState({ nombre: '', correo: '' });
  const [idEstudianteBuscar, setIdEstudianteBuscar] = useState('');
  const [estudianteEncontrado, setEstudianteEncontrado] = useState(null);

  // RESERVAS
  const [reservas, setReservas] = useState([]);
  const [idEstudianteReservas, setIdEstudianteReservas] = useState('');
  const [nuevaReserva, setNuevaReserva] = useState({
    idEstudiante: '',
    idEquipo: '',
    fechaInicio: '',
    fechaFin: ''
  });

  // ESTADISTICAS
  const [topEquipos, setTopEquipos] = useState([]);

  /*
  mostrarError(): intenta usar primero el mensaje que manda Spring Boot.
  Si no llega un mensaje específico, se muestra uno general en la alerta.
  */
  const mostrarError = (error, texto) => {
    let detalle = texto;

    if (error.response?.data?.error) {
      detalle = error.response.data.error;
    } else if (typeof error.response?.data === 'string') {
      detalle = error.response.data;
    } else if (error.code === 'ERR_NETWORK') {
      detalle = 'No se pudo conectar con el backend.';
    }

    setMensaje({ tipo: 'danger', texto: detalle });
  };

  // Muestra los mensajes de operaciones que terminaron correctamente.
  const mostrarExito = (texto) => {
    setMensaje({ tipo: 'success', texto });
  };

  // ---------------- EQUIPOS ----------------

  // Consulta los equipos teniendo en cuenta la pagina y la categoria seleccionada.
  const cargarEquipos = async (pag = pagina, categoria = categoriaFiltro) => {
    try {
      const params = { pag, size: 10 };
      if (categoria) params.categoria = categoria;

      const respuesta = await API.get('/equipos', { params });
      setEquipos(respuesta.data.content || []);
      setTotalPaginas(respuesta.data.totalPages || 0);
    } catch (error) {
      mostrarError(error, 'Error al cargar los equipos.');
    }
  };


  // Carga una lista amplia de equipos para poder mostrarlos al crear una reserva.
  const cargarEquiposReserva = async () => {
    try {
      const respuesta = await API.get('/equipos', { params: { pag: 0, size: 1000 } });
      setEquiposReserva(respuesta.data.content || []);
    } catch (error) {
      mostrarError(error, 'Error al cargar los equipos.');
    }
  };

  // Envía al backend los datos del formulario de nuevo equipo.
  const crearEquipo = async (e) => {
    e.preventDefault();

    try {
      await API.post('/equipos', nuevoEquipo);
      setNuevoEquipo({
        nombre: '',
        numSerie: '',
        categoriaEquipo: 'COMPUTADORES',
        estadoEquipo: 'BUENO'
      });
      mostrarExito('Equipo registrado.');
      setPagina(0);
      cargarEquipos(0, categoriaFiltro);
      cargarEquiposReserva();
    } catch (error) {
      mostrarError(error, 'Error al registrar el equipo.');
    }
  };

  // Actualiza el estado de un equipo usando el PUT del backend.
  const cambiarEstado = async (idEquipo, estadoNuevo) => {
    try {
      await API.put(`/equipos/${idEquipo}/${estadoNuevo}`);
      mostrarExito('Estado actualizado.');
      cargarEquipos();
    } catch (error) {
      mostrarError(error, 'Error al actualizar el estado.');
    }
  };

  // Al cambiar el filtro se vuelve a la primera pagina.
  const cambiarCategoriaFiltro = (categoria) => {
    setCategoriaFiltro(categoria);
    setPagina(0);
  };

  // ---------------- ESTUDIANTES ----------------

  // Consulta todos los estudiantes registrados.
  const cargarEstudiantes = async () => {
    try {
      const respuesta = await API.get('/estudiantes');
      setEstudiantes(respuesta.data || []);
    } catch (error) {
      mostrarError(error, 'Error al cargar los estudiantes.');
    }
  };

  // Registra un estudiante con nombre y correo.
  const crearEstudiante = async (e) => {
    e.preventDefault();

    try {
      await API.post('/estudiantes', nuevoEstudiante);
      setNuevoEstudiante({ nombre: '', correo: '' });
      mostrarExito('Estudiante registrado.');
      cargarEstudiantes();
    } catch (error) {
      mostrarError(error, 'Error al registrar el estudiante.');
    }
  };

  // Busca un estudiante específico por su id.
  const buscarEstudiante = async (e) => {
    e.preventDefault();
    setEstudianteEncontrado(null);

    try {
      const respuesta = await API.get(`/estudiantes/estudiante/${idEstudianteBuscar}`);
      setEstudianteEncontrado(respuesta.data);
    } catch (error) {
      mostrarError(error, 'Error al buscar el estudiante.');
    }
  };

  // ---------------- RESERVAS ----------------

  /*
  crearReserva(): valida primero las fechas en el frontend y después manda la petición.
  La validación importante de traslapes vuelve a hacerse en el backend.
  */
  const crearReserva = async (e) => {
    e.preventDefault();

    if (nuevaReserva.fechaFin <= nuevaReserva.fechaInicio) {
      setMensaje({ tipo: 'warning', texto: 'La fecha final debe ser mayor a la fecha inicial.' });
      return;
    }

    try {
      await API.post('/reservas', {
        idEstudiante: Number(nuevaReserva.idEstudiante),
        idEquipo: Number(nuevaReserva.idEquipo),
        fechaInicio: completarFecha(nuevaReserva.fechaInicio),
        fechaFin: completarFecha(nuevaReserva.fechaFin)
      });

      mostrarExito('Reserva creada.');
      setNuevaReserva({
        idEstudiante: '',
        idEquipo: '',
        fechaInicio: '',
        fechaFin: ''
      });
    } catch (error) {
      mostrarError(error, 'Error al crear la reserva.');
    }
  };

  // Consulta las reservas del estudiante seleccionado.
  const buscarReservas = async (e) => {
    e.preventDefault();

    try {
      const respuesta = await API.get(`/reservas/${idEstudianteReservas}`);
      setReservas(respuesta.data || []);
    } catch (error) {
      setReservas([]);
      mostrarError(error, 'Error al consultar las reservas.');
    }
  };

  // Pide confirmación y luego elimina la reserva por su id.
  const cancelarReserva = async (idReserva) => {
    if (!window.confirm('¿Cancelar reserva?')) return;

    try {
      await API.delete(`/reservas/${idReserva}`);
      setReservas(reservas.filter((reserva) => reserva.reservaId !== idReserva));
      mostrarExito('Reserva cancelada.');
    } catch (error) {
      mostrarError(error, 'Error al cancelar la reserva.');
    }
  };

  // ---------------- ESTADISTICAS ----------------

  // Consulta el Top 5 de equipos más reservados.
  const cargarEstadisticas = async () => {
    try {
      const respuesta = await API.get('/reservas/estadisticas/top-equipos');
      setTopEquipos(respuesta.data || []);
    } catch (error) {
      mostrarError(error, 'Error al cargar las estadísticas.');
    }
  };

  // datetime-local normalmente llega hasta minutos, por eso se agregan los segundos si hacen falta.
  const completarFecha = (fecha) => {
    return fecha.length === 16 ? `${fecha}:00` : fecha;
  };

  // Devuelve la clase de Bootstrap usada para diferenciar visualmente cada estado.
  const claseEstado = (estado) => {
    if (estado === 'BUENO') return 'bg-success';
    if (estado === 'REGULAR') return 'bg-warning text-dark';
    if (estado === 'MALO') return 'bg-danger';
    return 'bg-secondary';
  };

  // Cuando cambia la categoria se vuelve a consultar el listado sin recargar toda la pagina.
  useEffect(() => {
    cargarEquipos(0, categoriaFiltro);
  }, [categoriaFiltro]);

  // Al iniciar se cargan los datos que se usan en las distintas pestañas.
  useEffect(() => {
    cargarEstudiantes();
    cargarEquiposReserva();
  }, []);

  return (
    <div className="container py-4">
      <h2 className="mb-4">Dashboard de Monitoreo de Recursos</h2>

      {mensaje && (
        <div className={`alert alert-${mensaje.tipo} alert-dismissible`}>
          {mensaje.texto}
          <button className="btn-close" onClick={() => setMensaje(null)}></button>
        </div>
      )}

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'equipos' ? 'active' : ''}`}
            onClick={() => setTab('equipos')}
          >
            Equipos
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'estudiantes' ? 'active' : ''}`}
            onClick={() => setTab('estudiantes')}
          >
            Estudiantes
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'reservas' ? 'active' : ''}`}
            onClick={() => setTab('reservas')}
          >
            Reservas
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${tab === 'estadisticas' ? 'active' : ''}`}
            onClick={() => {
              setTab('estadisticas');
              cargarEstadisticas();
            }}
          >
            Estadísticas
          </button>
        </li>
      </ul>

      {/* VISTA DE EQUIPOS */}
      {tab === 'equipos' && (
        <div>
          <div className="row mb-4">
            <div className="col-lg-4 mb-3">
              <div className="card p-3">
                <h5>Nuevo equipo</h5>
                <form onSubmit={crearEquipo}>
                  <div className="mb-2">
                    <label className="form-label">Nombre</label>
                    <input
                      className="form-control"
                      value={nuevoEquipo.nombre}
                      onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, nombre: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Número de serie</label>
                    <input
                      className="form-control"
                      value={nuevoEquipo.numSerie}
                      onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, numSerie: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label">Categoría</label>
                    <select
                      className="form-select"
                      value={nuevoEquipo.categoriaEquipo}
                      onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, categoriaEquipo: e.target.value })}
                    >
                      {categorias.map((categoria) => (
                        <option key={categoria} value={categoria}>{categoria}</option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Estado</label>
                    <select
                      className="form-select"
                      value={nuevoEquipo.estadoEquipo}
                      onChange={(e) => setNuevoEquipo({ ...nuevoEquipo, estadoEquipo: e.target.value })}
                    >
                      {estados.map((estado) => (
                        <option key={estado} value={estado}>{estado}</option>
                      ))}
                    </select>
                  </div>

                  <button className="btn btn-primary">Guardar</button>
                </form>
              </div>
            </div>

            <div className="col-lg-8">
              <div className="card p-3">
                <h5>Equipos</h5>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Filtrar por categoría</label>
                    <select
                      className="form-select"
                      value={categoriaFiltro}
                      onChange={(e) => cambiarCategoriaFiltro(e.target.value)}
                    >
                      <option value="">Todas</option>
                      {categorias.map((categoria) => (
                        <option key={categoria} value={categoria}>{categoria}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-striped align-middle">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Serie</th>
                        <th>Categoría</th>
                        <th>Estado</th>
                        <th>Cambiar estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipos.map((equipo) => (
                        <tr key={equipo.equipoId}>
                          <td>{equipo.equipoId}</td>
                          <td>{equipo.nombre}</td>
                          <td>{equipo.numSerie}</td>
                          <td>{equipo.categoria}</td>
                          <td>
                            <span className={`badge estado ${claseEstado(equipo.estado)}`}>
                              {equipo.estado}
                            </span>
                          </td>
                          <td>
                            <select
                              className="form-select form-select-sm"
                              value={equipo.estado}
                              onChange={(e) => cambiarEstado(equipo.equipoId, e.target.value)}
                            >
                              {estados.map((estado) => (
                                <option key={estado} value={estado}>{estado}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {equipos.length === 0 && <p>No hay equipos.</p>}

                {totalPaginas > 1 && (
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={pagina === 0}
                      onClick={() => {
                        const nuevaPagina = pagina - 1;
                        setPagina(nuevaPagina);
                        cargarEquipos(nuevaPagina, categoriaFiltro);
                      }}
                    >
                      Anterior
                    </button>

                    <span>{pagina + 1} / {totalPaginas}</span>

                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={pagina >= totalPaginas - 1}
                      onClick={() => {
                        const nuevaPagina = pagina + 1;
                        setPagina(nuevaPagina);
                        cargarEquipos(nuevaPagina, categoriaFiltro);
                      }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA DE ESTUDIANTES */}
      {tab === 'estudiantes' && (
        <div className="row">
          <div className="col-lg-4 mb-3">
            <div className="card p-3 mb-3">
              <h5>Nuevo estudiante</h5>
              <form onSubmit={crearEstudiante}>
                <div className="mb-2">
                  <label className="form-label">Nombre</label>
                  <input
                    className="form-control"
                    value={nuevoEstudiante.nombre}
                    onChange={(e) => setNuevoEstudiante({ ...nuevoEstudiante, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Correo</label>
                  <input
                    type="email"
                    className="form-control"
                    value={nuevoEstudiante.correo}
                    onChange={(e) => setNuevoEstudiante({ ...nuevoEstudiante, correo: e.target.value })}
                    required
                  />
                </div>

                <button className="btn btn-primary">Guardar</button>
              </form>
            </div>

            <div className="card p-3">
              <h5>Buscar estudiante</h5>
              <form onSubmit={buscarEstudiante}>
                <div className="mb-2">
                  <label className="form-label">ID</label>
                  <input
                    type="number"
                    className="form-control"
                    value={idEstudianteBuscar}
                    onChange={(e) => setIdEstudianteBuscar(e.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-secondary">Buscar</button>
              </form>

              {estudianteEncontrado && (
                <div className="mt-3">
                  <p className="mb-1"><strong>ID:</strong> {estudianteEncontrado.id}</p>
                  <p className="mb-1"><strong>Nombre:</strong> {estudianteEncontrado.nombre}</p>
                  <p className="mb-0"><strong>Correo:</strong> {estudianteEncontrado.correo}</p>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-8">
            <div className="card p-3">
              <h5>Estudiantes</h5>
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Correo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estudiantes.map((estudiante) => (
                      <tr key={estudiante.id}>
                        <td>{estudiante.id}</td>
                        <td>{estudiante.nombre}</td>
                        <td>{estudiante.correo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA DE RESERVAS */}
      {tab === 'reservas' && (
        <div className="row">
          <div className="col-lg-5 mb-3">
            <div className="card p-3">
              <h5>Nueva reserva</h5>
              <form onSubmit={crearReserva}>
                <div className="mb-2">
                  <label className="form-label">Estudiante</label>
                  <select
                    className="form-select"
                    value={nuevaReserva.idEstudiante}
                    onChange={(e) => setNuevaReserva({ ...nuevaReserva, idEstudiante: e.target.value })}
                    required
                  >
                    <option value="">Seleccione</option>
                    {estudiantes.map((estudiante) => (
                      <option key={estudiante.id} value={estudiante.id}>
                        {estudiante.id} - {estudiante.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label">Equipo</label>
                  <select
                    className="form-select"
                    value={nuevaReserva.idEquipo}
                    onChange={(e) => setNuevaReserva({ ...nuevaReserva, idEquipo: e.target.value })}
                    required
                  >
                    <option value="">Seleccione</option>
                    {equiposReserva.map((equipo) => (
                      <option key={equipo.equipoId} value={equipo.equipoId}>
                        {equipo.equipoId} - {equipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label">Fecha inicio</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={nuevaReserva.fechaInicio}
                    onChange={(e) => setNuevaReserva({ ...nuevaReserva, fechaInicio: e.target.value })}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Fecha fin</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={nuevaReserva.fechaFin}
                    onChange={(e) => setNuevaReserva({ ...nuevaReserva, fechaFin: e.target.value })}
                    required
                  />
                </div>

                <button className="btn btn-primary">Crear reserva</button>
              </form>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card p-3">
              <h5>Reservas</h5>

              <form onSubmit={buscarReservas} className="row g-2 mb-3">
                <div className="col-md-8">
                  <label className="form-label">Estudiante</label>
                  <select
                    className="form-select"
                    value={idEstudianteReservas}
                    onChange={(e) => setIdEstudianteReservas(e.target.value)}
                    required
                  >
                    <option value="">Seleccione</option>
                    {estudiantes.map((estudiante) => (
                      <option key={estudiante.id} value={estudiante.id}>
                        {estudiante.id} - {estudiante.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button className="btn btn-secondary w-100">Buscar</button>
                </div>
              </form>

              <div className="table-responsive">
                <table className="table table-bordered table-striped align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Equipo</th>
                      <th>Inicio</th>
                      <th>Fin</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservas.map((reserva) => (
                      <tr key={reserva.reservaId}>
                        <td>{reserva.reservaId}</td>
                        <td>{reserva.equipo?.nombre}</td>
                        <td>{reserva.fechaInicio}</td>
                        <td>{reserva.fechaFin}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => cancelarReserva(reserva.reservaId)}
                          >
                            Cancelar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VISTA DE ESTADISTICAS */}
      {tab === 'estadisticas' && (
        <div className="card p-3">
          <h5>Top 5 equipos más reservados</h5>

          <div className="table-responsive">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Posición</th>
                  <th>Equipo</th>
                  <th>Reservas</th>
                </tr>
              </thead>
              <tbody>
                {topEquipos.map((equipo, index) => (
                  <tr key={equipo.equipoId}>
                    <td>{index + 1}</td>
                    <td>{equipo.nombre}</td>
                    <td>{equipo.cantidadReservas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {topEquipos.length === 0 && <p>No hay datos.</p>}
        </div>
      )}
    </div>
  );
}

export default App;
