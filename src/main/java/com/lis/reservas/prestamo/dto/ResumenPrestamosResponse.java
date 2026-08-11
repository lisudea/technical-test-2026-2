package com.lis.reservas.prestamo.dto;

/**
 * Counters for the auxiliar's console header, all scoped to the requested
 * day.
 *
 * @param pendientes   booked for today, not yet handed over
 * @param entregados   currently out with a user
 * @param devueltos    returned today
 * @param noReclamados declared unclaimed today
 * @param vencidos     handed over but past their end time and still not back
 */
public record ResumenPrestamosResponse(
        long pendientes,
        long entregados,
        long devueltos,
        long noReclamados,
        long vencidos) {
}
