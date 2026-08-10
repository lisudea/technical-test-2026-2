import { useState, useEffect } from 'react';
import { getEquipos, createEquipo, updateEquipo } from '../services/equipoService';

const initialForm = {
    nombre: '',
    numero_serie_mac: '',
    categoria: '',
    estado: 'DISPONIBLE'
};

const Equipos = () => {
    const [equipos, setEquipos] = useState([]);
    const [formData, setFormData] = useState(initialForm);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const cargarEquipos = async () => {
        try {
            const data = await getEquipos();
            setEquipos(data);
        } catch (error) {
            alert('Hubo un error al cargar los equipos');
        }
    };

    useEffect(() => {
        cargarEquipos();
    }, []);

    const resetForm = () => {
        setFormData(initialForm);
        setIsEditing(false);
        setEditingId(null);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (isEditing && editingId) {
                await updateEquipo(editingId, formData);
                alert('¡Equipo actualizado con éxito!');
            } else {
                await createEquipo(formData);
                alert('¡Equipo guardado con éxito!');
            }

            resetForm();
            cargarEquipos();
        } catch (error) {
            const mensaje = error.response?.data?.detail || 'Error al guardar el equipo.';
            alert(mensaje);
        }
    };

    const handleEdit = (equipo) => {
        setFormData({
            nombre: equipo.nombre,
            numero_serie_mac: equipo.numero_serie_mac,
            categoria: equipo.categoria,
            estado: equipo.estado
        });
        setIsEditing(true);
        setEditingId(equipo.id);
    };

    const cambiarEstado = async (equipoId, nuevoEstado) => {
        try {
            await updateEquipo(equipoId, { estado: nuevoEstado });
            cargarEquipos();
        } catch (error) {
            const mensaje = error.response?.data?.detail || 'No se pudo actualizar el estado del equipo.';
            alert(mensaje);
        }
    };

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            <h1 style={{ color: '#fffefe' }}>Gestión de Equipos</h1>

            <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #ddd' }}>
                <h3 style={{ marginTop: 0, color: '#444' }}>
                    {isEditing ? 'Editar Equipo' : 'Registrar Nuevo Equipo'}
                </h3>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        type="text" name="nombre" placeholder="Nombre del Equipo"
                        value={formData.nombre} onChange={handleChange} required
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <input
                        type="text" name="numero_serie_mac" placeholder="Número de Serie / MAC"
                        value={formData.numero_serie_mac} onChange={handleChange} required
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <input
                        type="text" name="categoria" placeholder="Categoría (Ej. Electrónica)"
                        value={formData.categoria} onChange={handleChange} required
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <select
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    >
                        <option value="DISPONIBLE">Disponible</option>
                        <option value="RESERVADO">Reservado</option>
                        <option value="MANTENIMIENTO">Mantenimiento</option>
                    </select>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button type="submit" style={{
                            padding: '10px 16px', background: '#4A90E2', color: 'white',
                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                        }}>
                            {isEditing ? 'Actualizar Equipo' : 'Guardar Equipo'}
                        </button>

                        {isEditing && (
                            <button type="button" onClick={resetForm} style={{
                                padding: '10px 16px', background: '#6c757d', color: 'white',
                                border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                            }}>
                                Cancelar
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div>
                <h3 style={{ color: '#444' }}>Inventario Actual ({equipos.length})</h3>
                {equipos.length === 0 ? (
                    <p style={{ color: '#666' }}>No hay equipos registrados aún.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {equipos.map((equipo) => (
                            <div key={equipo.id} style={{
                                padding: '15px', border: '1px solid #e0e0e0',
                                borderRadius: '6px', background: '#fff',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap'
                            }}>
                                <div>
                                    <strong style={{ fontSize: '1.1em', color: '#222' }}>{equipo.nombre}</strong>
                                    <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9em' }}>
                                        Serie: {equipo.numero_serie_mac} | Categoría: {equipo.categoria}
                                    </p>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{
                                        padding: '5px 10px', borderRadius: '15px', fontSize: '0.8em', fontWeight: 'bold',
                                        background: equipo.estado === 'DISPONIBLE' ? '#d4edda' : equipo.estado === 'RESERVADO' ? '#f8d7da' : '#e2e3e5',
                                        color: equipo.estado === 'DISPONIBLE' ? '#155724' : equipo.estado === 'RESERVADO' ? '#721c24' : '#383d41'
                                    }}>
                                        {equipo.estado}
                                    </span>

                                    <select
                                        value={equipo.estado}
                                        onChange={(e) => cambiarEstado(equipo.id, e.target.value)}
                                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc' }}
                                    >
                                        <option value="DISPONIBLE">Disponible</option>
                                        <option value="RESERVADO">Reservado</option>
                                        <option value="MANTENIMIENTO">Mantenimiento</option>
                                    </select>

                                    <button
                                        type="button"
                                        onClick={() => handleEdit(equipo)}
                                        style={{
                                            padding: '6px 10px', background: '#ffc107', color: '#212529',
                                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                                        }}
                                    >
                                        Editar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Equipos;