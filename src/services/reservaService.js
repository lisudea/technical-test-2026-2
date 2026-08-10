import api from '../api/axios';

// Crear una nueva reserva
export const createReserva = async (nuevaReserva) => {
    try {
        const response = await api.post('/reservas/', nuevaReserva);
        return response.data;
    } catch (error) {
        throw error;
    }
};

// Obtener reservas de un equipo específico, con filtro opcional por rango de fechas
export const getReservasPorEquipo = async (equipoId, filtros = {}) => {
    try {
        const response = await api.get(`/reservas/equipo/${equipoId}`, { params: filtros });
        return response.data;
    } catch (error) {
        console.error('Error al obtener reservas:', error);
        throw error;
    }
};

// Cancelar una reserva
export const cancelarReserva = async (reservaId) => {
    try {
        const response = await api.patch(`/reservas/${reservaId}/cancelar`);
        return response.data;
    } catch (error) {
        throw error;
    }
};