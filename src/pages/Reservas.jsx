import { useState, useEffect } from 'react';
import { getEquipos } from '../services/equipoService';
import { createReserva, getReservasPorEquipo, cancelarReserva } from '../services/reservaService';

const Reservas = () => {
    const [equipos, setEquipos] = useState([]);
    const [reservas, setReservas] = useState([]);
    const [equipoSeleccionado, setEquipoSeleccionado] = useState('');
    const [feedback, setFeedback] = useState({ type: '', message: '' });
    const [filtroFechaInicio, setFiltroFechaInicio] = useState('');
    const [filtroFechaFin, setFiltroFechaFin] = useState('');

    const [formData, setFormData] = useState({
        nombre_usuario: '',
        correo_usuario: '',
        fecha_inicio: '',
        fecha_fin: ''
    });

    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const dataEquipos = await getEquipos();
                setEquipos(dataEquipos);
            } catch (error) {
                console.error('Error al cargar equipos');
                setFeedback({
                    type: 'error',
                    message: 'No se pudieron cargar los equipos disponibles para reservar.'
                });
            }
        };
        cargarDatos();
    }, []);

    useEffect(() => {
        if (equipoSeleccionado) {
            cargarHistorial(equipoSeleccionado, {
                fecha_inicio: filtroFechaInicio || undefined,
                fecha_fin: filtroFechaFin || undefined,
            });
        } else {
            setReservas([]);
        }
    }, [equipoSeleccionado]);

    const cargarHistorial = async (id, filtros = {}) => {
        try {
            const data = await getReservasPorEquipo(id, filtros);
            setReservas(data);
        } catch (error) {
            console.error('Error cargando historial');
            setFeedback({ type: 'error', message: 'No se pudo cargar el historial de reservas del equipo.' });
        }
    };

    const aplicarFiltro = () => {
        if (!equipoSeleccionado) {
            setFeedback({ type: 'error', message: 'Primero selecciona un equipo para filtrar sus reservas.' });
            return;
        }

        if (filtroFechaInicio && filtroFechaFin) {
            const inicio = new Date(filtroFechaInicio);
            const fin = new Date(filtroFechaFin);
            if (inicio >= fin) {
                setFeedback({ type: 'error', message: 'La fecha de inicio debe ser anterior a la de fin.' });
                return;
            }
        }

        cargarHistorial(equipoSeleccionado, {
            fecha_inicio: filtroFechaInicio || undefined,
            fecha_fin: filtroFechaFin || undefined,
        });

        setFeedback({ type: 'success', message: 'Filtro aplicado correctamente.' });
    };

    const limpiarFiltro = () => {
        setFiltroFechaInicio('');
        setFiltroFechaFin('');
        if (equipoSeleccionado) {
            cargarHistorial(equipoSeleccionado);
        }
        setFeedback({ type: 'success', message: 'Filtro limpio. Mostrando todas las reservas.' });
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!equipoSeleccionado) {
            setFeedback({ type: 'error', message: 'Por favor, selecciona un equipo primero.' });
            return;
        }

        if (!formData.fecha_inicio || !formData.fecha_fin) {
            setFeedback({ type: 'error', message: 'Debes completar la fecha de inicio y la fecha de fin.' });
            return;
        }

        const inicio = new Date(formData.fecha_inicio);
        const fin = new Date(formData.fecha_fin);

        if (inicio >= fin) {
            setFeedback({ type: 'error', message: 'La fecha de inicio debe ser anterior a la fecha de fin.' });
            return;
        }

        const nuevaReserva = {
            equipo_id: parseInt(equipoSeleccionado, 10),
            nombre_usuario: formData.nombre_usuario,
            correo_usuario: formData.correo_usuario,
            fecha_inicio: inicio.toISOString(),
            fecha_fin: fin.toISOString()
        };

        try {
            await createReserva(nuevaReserva);
            setFeedback({ type: 'success', message: '✅ Reserva creada con éxito.' });
            setFormData({ nombre_usuario: '', correo_usuario: '', fecha_inicio: '', fecha_fin: '' });
            cargarHistorial(equipoSeleccionado, {
                fecha_inicio: filtroFechaInicio || undefined,
                fecha_fin: filtroFechaFin || undefined,
            });
        } catch (error) {
            const mensajeError = error.response?.data?.detail || 'No se pudo crear la reserva.';
            setFeedback({ type: 'error', message: `❌ ${mensajeError}` });
        }
    };

    const handleCancelar = async (reservaId) => {
        if (window.confirm('¿Estás seguro de cancelar esta reserva?')) {
            try {
                await cancelarReserva(reservaId);
                setFeedback({ type: 'success', message: 'Reserva cancelada correctamente.' });
                cargarHistorial(equipoSeleccionado, {
                    fecha_inicio: filtroFechaInicio || undefined,
                    fecha_fin: filtroFechaFin || undefined,
                });
            } catch (error) {
                setFeedback({ type: 'error', message: 'No se pudo cancelar la reserva.' });
            }
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#fff' }}>Gestión de Reservas</h1>

            {feedback.message && (
                <div style={{
                    marginBottom: '20px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    background: feedback.type === 'success' ? '#d4edda' : '#f8d7da',
                    color: feedback.type === 'success' ? '#155724' : '#721c24',
                    border: `1px solid ${feedback.type === 'success' ? '#c3e6cb' : '#f5c2c7'}`
                }}>
                    {feedback.message}
                </div>
            )}

            <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Selecciona el Equipo a reservar:</label>
                <select
                    value={equipoSeleccionado}
                    onChange={(e) => setEquipoSeleccionado(e.target.value)}
                    style={{ padding: '10px', width: '100%', borderRadius: '4px', border: '1px solid #ccc' }}
                >
                    <option value="">-- Selecciona un equipo --</option>
                    {equipos.map((equipo) => (
                        <option key={equipo.id} value={equipo.id}>
                            {equipo.nombre} ({equipo.estado})
                        </option>
                    ))}
                </select>
            </div>

            {equipoSeleccionado && (
                <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ddd' }}>
                    <h3 style={{ marginTop: 0, color: '#444' }}>Nueva Reserva</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input type="text" name="nombre_usuario" placeholder="Tu Nombre Completo" value={formData.nombre_usuario} onChange={handleChange} required style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                        <input type="email" name="correo_usuario" placeholder="Tu Correo Electrónico" value={formData.correo_usuario} onChange={handleChange} required style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '220px' }}>
                                <label style={{ fontSize: '0.9em', color: '#666', display: 'block', marginBottom: '5px' }}>Fecha y Hora de Inicio</label>
                                <input type="datetime-local" name="fecha_inicio" value={formData.fecha_inicio} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: '220px' }}>
                                <label style={{ fontSize: '0.9em', color: '#666', display: 'block', marginBottom: '5px' }}>Fecha y Hora de Fin</label>
                                <input type="datetime-local" name="fecha_fin" value={formData.fecha_fin} onChange={handleChange} required style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
                            </div>
                        </div>

                        <button type="submit" style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                            Confirmar Reserva
                        </button>
                    </form>
                </div>
            )}

            {equipoSeleccionado && (
                <div style={{ marginTop: '20px', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                    <h3 style={{ color: '#444', marginTop: 0 }}>Historial del Equipo</h3>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '0.9em' }}>Fecha inicio</label>
                            <input
                                type="datetime-local"
                                value={filtroFechaInicio}
                                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: '220px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', color: '#666', fontSize: '0.9em' }}>Fecha fin</label>
                            <input
                                type="datetime-local"
                                value={filtroFechaFin}
                                onChange={(e) => setFiltroFechaFin(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={aplicarFiltro} style={{ background: '#4A90E2', color: 'white', border: 'none', borderRadius: '4px', padding: '10px 14px', cursor: 'pointer', fontWeight: 'bold' }}>
                            Aplicar filtro
                        </button>
                        <button type="button" onClick={limpiarFiltro} style={{ background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', padding: '10px 14px', cursor: 'pointer' }}>
                            Limpiar
                        </button>
                    </div>

                    {reservas.length === 0 ? (
                        <p style={{ color: '#666' }}>No hay reservas registradas para este equipo en este rango de fechas.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {reservas.map((res) => (
                                <div key={res.id} style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '6px', background: res.estado === 'ACTIVA' ? '#fff' : '#f9f9f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                                    <div>
                                        <strong style={{ color: '#222' }}>{res.nombre_usuario}</strong>
                                        <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9em' }}>
                                            Desde: {new Date(res.fecha_inicio).toLocaleString()} <br/>
                                            Hasta: {new Date(res.fecha_fin).toLocaleString()}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px' }}>
                                        <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '0.7em', fontWeight: 'bold', background: res.estado === 'ACTIVA' ? '#d1ecf1' : '#e2e3e5', color: res.estado === 'ACTIVA' ? '#0c5460' : '#383d41' }}>
                                            {res.estado}
                                        </span>
                                        {res.estado === 'ACTIVA' && (
                                            <button onClick={() => handleCancelar(res.id)} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8em' }}>
                                                Cancelar
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Reservas;