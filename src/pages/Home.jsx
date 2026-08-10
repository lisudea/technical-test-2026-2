import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getEquipos, getTopEquipos } from '../services/equipoService';

const estadoConfig = {
    DISPONIBLE: { label: 'Disponible', color: '#d4edda', text: '#155724', icon: '🟢' },
    RESERVADO: { label: 'Reservado', color: '#f8d7da', text: '#721c24', icon: '🔴' },
    MANTENIMIENTO: { label: 'Mantenimiento', color: '#e2e3e5', text: '#383d41', icon: '⚪' },
};

const Home = () => {
    const [equipos, setEquipos] = useState([]);
    const [topEquipos, setTopEquipos] = useState([]);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState('TODAS');
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const cargarDatos = async (categoria = categoriaSeleccionada) => {
        try {
            setLoading(true);
            setError('');

            const params = categoria !== 'TODAS' ? { categoria } : {};
            const [listaEquipos, listaTop] = await Promise.all([
                getEquipos(params),
                getTopEquipos(),
            ]);

            setEquipos(listaEquipos);
            setTopEquipos(listaTop);
        } catch (err) {
            setError('No se pudieron cargar los datos del laboratorio. Inténtalo de nuevo más tarde.');
            console.error('Error cargando dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarDatos(categoriaSeleccionada);
    }, [categoriaSeleccionada]);

    const categorias = useMemo(() => {
        const categoriasUnicas = [...new Set(equipos.map((equipo) => equipo.categoria).filter(Boolean))];
        return categoriasUnicas.sort((a, b) => a.localeCompare(b));
    }, [equipos]);

    const equiposFiltrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();

        return equipos.filter((equipo) => {
            const coincideBusqueda =
                !texto ||
                equipo.nombre.toLowerCase().includes(texto) ||
                equipo.numero_serie_mac.toLowerCase().includes(texto) ||
                equipo.categoria.toLowerCase().includes(texto);

            return coincideBusqueda;
        });
    }, [equipos, busqueda]);

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f0f4f8', borderRadius: '12px', marginBottom: '30px' }}>
                <h1 style={{ color: '#2c3e50', margin: '0 0 10px 0' }}>Dashboard del Laboratorio LIS</h1>
                <p style={{ color: '#546e7a', fontSize: '1.1em', margin: '0 0 20px 0' }}>
                    Visualiza el estado actual de los equipos, sus reservas y el uso del laboratorio.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', flexWrap: 'wrap' }}>
                    <Link to="/equipos" style={{ padding: '10px 20px', background: '#4A90E2', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                        Gestionar Equipos
                    </Link>
                    <Link to="/reservas" style={{ padding: '10px 20px', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold' }}>
                        Nueva Reserva
                    </Link>
                </div>
            </div>

            {error && (
                <div style={{ background: '#f8d7da', color: '#721c24', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c2c7' }}>
                    {error}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '30px' }}>
                <div style={{ background: '#e8f5e9', borderRadius: '10px', padding: '20px', border: '1px solid #c8e6c9' }}>
                    <div style={{ color: '#2e7d32', fontWeight: 'bold' }}>Equipos Disponibles</div>
                    <h3 style={{ margin: '12px 0 0 0', fontSize: '2rem', color: '#1b5e20' }}>
                        {equipos.filter((e) => e.estado === 'DISPONIBLE').length}
                    </h3>
                </div>
                <div style={{ background: '#fff3e0', borderRadius: '10px', padding: '20px', border: '1px solid #ffe0b2' }}>
                    <div style={{ color: '#ef6c00', fontWeight: 'bold' }}>Reservados</div>
                    <h3 style={{ margin: '12px 0 0 0', fontSize: '2rem', color: '#e65100' }}>
                        {equipos.filter((e) => e.estado === 'RESERVADO').length}
                    </h3>
                </div>
                <div style={{ background: '#f3f4f6', borderRadius: '10px', padding: '20px', border: '1px solid #d1d5db' }}>
                    <div style={{ color: '#374151', fontWeight: 'bold' }}>Mantenimiento</div>
                    <h3 style={{ margin: '12px 0 0 0', fontSize: '2rem', color: '#111827' }}>
                        {equipos.filter((e) => e.estado === 'MANTENIMIENTO').length}
                    </h3>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px' }}>
                <section style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <h2 style={{ margin: 0, color: '#333' }}>Equipos del laboratorio</h2>
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por nombre, serie o categoría"
                                style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px', minWidth: '220px' }}
                            />
                            <select
                                value={categoriaSeleccionada}
                                onChange={(e) => setCategoriaSeleccionada(e.target.value)}
                                style={{ padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: '6px' }}
                            >
                                <option value="TODAS">Todas las categorías</option>
                                {categorias.map((categoria) => (
                                    <option key={categoria} value={categoria}>{categoria}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {loading ? (
                        <p style={{ color: '#666' }}>Cargando equipos...</p>
                    ) : equiposFiltrados.length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>No se encontraron equipos con esos filtros.</p>
                    ) : (
                        <div style={{ display: 'grid', gap: '14px' }}>
                            {equiposFiltrados.map((equipo) => {
                                const estado = estadoConfig[equipo.estado] || {
                                    label: equipo.estado,
                                    color: '#e5e7eb',
                                    text: '#111827',
                                    icon: '◼️'
                                };

                                return (
                                    <div key={equipo.id} style={{ border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', background: '#fafafa' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                            <div>
                                                <h3 style={{ margin: '0 0 6px 0', color: '#1f2937' }}>{equipo.nombre}</h3>
                                                <p style={{ margin: 0, color: '#6b7280', fontSize: '0.92rem' }}>
                                                    Serie: {equipo.numero_serie_mac} • {equipo.categoria}
                                                </p>
                                            </div>
                                            <span style={{
                                                background: estado.color,
                                                color: estado.text,
                                                padding: '6px 12px',
                                                borderRadius: '999px',
                                                fontWeight: 'bold',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '6px'
                                            }}>
                                                <span>{estado.icon}</span>
                                                {estado.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                <aside style={{ background: '#fff', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' }}>
                    <h2 style={{ margin: '0 0 16px 0', color: '#333' }}>Top equipos más solicitados</h2>

                    {topEquipos.length === 0 ? (
                        <p style={{ color: '#666', fontStyle: 'italic' }}>Aún no hay suficientes reservas para mostrar estadísticas.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {topEquipos.map((equipo, index) => (
                                <div key={equipo.equipo_id ?? index} style={{
                                    padding: '12px 14px',
                                    borderRadius: '8px',
                                    border: '1px solid #e5e7eb',
                                    background: index === 0 ? '#fff8e1' : '#f9fafb'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                                        <strong>#{index + 1} {equipo.nombre}</strong>
                                        <span style={{ background: '#dbeafe', color: '#1d4ed8', borderRadius: '999px', padding: '4px 8px', fontWeight: 'bold' }}>
                                            {equipo.total_reservas} reservas
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>
            </div>
        </div>
    );
};

export default Home;