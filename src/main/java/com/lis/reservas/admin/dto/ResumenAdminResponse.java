package com.lis.reservas.admin.dto;

/**
 * The numbers an administrator needs on one screen to know whether the lab
 * is healthy right now.
 *
 * <p>Every field is computed on demand from the source tables; nothing here
 * is a stored counter that could drift out of sync with reality.
 *
 * @param totalEquipos          equipment in the catalog
 * @param equiposDisponibles    bookable equipment
 * @param equiposMantenimiento  equipment out for maintenance
 * @param equiposBaja           decommissioned equipment
 * @param reservasActivas       bookings not yet cancelled or completed
 * @param reservasEnCurso       bookings whose window contains "now"
 * @param prestamosPendientes   today's bookings not yet handed over
 * @param prestamosVencidos     equipment out past its return time
 * @param sancionesVigentes     sanctions currently in force
 * @param totalUsuarios         registered users
 * @param totalAuxiliares       users with the AUXILIAR role
 * @param totalAdmins           users with the ADMIN role
 */
public record ResumenAdminResponse(
        long totalEquipos,
        long equiposDisponibles,
        long equiposMantenimiento,
        long equiposBaja,
        long reservasActivas,
        long reservasEnCurso,
        long prestamosPendientes,
        long prestamosVencidos,
        long sancionesVigentes,
        long totalUsuarios,
        long totalAuxiliares,
        long totalAdmins) {
}
