import api from '../api/axios';

// Obtener todos los equipos con filtros opcionales
export const getEquipos = async (params = {}) => {
    try {
        const response = await api.get('/equipos/', { params });
        return response.data;
    } catch (error) {
        console.error("Error al obtener los equipos:", error);
        throw error;
    }
};

// Crear un equipo
export const createEquipo = async (nuevoEquipo) => {
    try {
        const response = await api.post('/equipos/', nuevoEquipo);
        return response.data;
    } catch (error) {
        console.error("Error al crear el equipo:", error);
        throw error;
    }
};

// Actualizar un equipo
export const updateEquipo = async (equipoId, cambios) => {
    try {
        const response = await api.put(`/equipos/${equipoId}`, cambios);
        return response.data;
    } catch (error) {
        console.error("Error al actualizar el equipo:", error);
        throw error;
    }
};

// Obtener equipos top
export const getTopEquipos = async () => {
    try {
        const response = await api.get('/equipos/estadisticas/top');
        return response.data;
    } catch (error) {
        console.error("Error al obtener las estadísticas:", error);
        throw error;
    }
};