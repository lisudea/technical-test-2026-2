package com.lis.reservas.prestamo.dto;

import jakarta.validation.constraints.Size;

/**
 * Request body for {@code POST /api/v1/prestamos/{id}/devolucion}.
 *
 * <p>{@code requiereMantenimiento} exists because the return counter is the
 * moment damage is actually discovered. Letting the auxiliar flag it in the
 * same action moves the equipment to MANTENIMIENTO immediately, instead of
 * relying on someone remembering to do it in a separate screen while the
 * next student is already booking the broken unit.
 *
 * @param observaciones         condition notes taken at check-in (optional)
 * @param requiereMantenimiento send the equipment straight to MANTENIMIENTO
 */
public record DevolucionRequest(
        @Size(max = 500) String observaciones,
        boolean requiereMantenimiento) {
}
