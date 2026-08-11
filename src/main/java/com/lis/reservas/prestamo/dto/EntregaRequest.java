package com.lis.reservas.prestamo.dto;

import jakarta.validation.constraints.Size;

/**
 * Request body for {@code POST /api/v1/prestamos/{id}/entrega}.
 *
 * <p>Everything about the hand-over that is not a free-text note is derived
 * server-side: who handed it over comes from the token, when comes from the
 * clock. A client cannot backdate a hand-over or attribute it to a colleague.
 *
 * @param observaciones condition notes taken at the counter (optional)
 */
public record EntregaRequest(@Size(max = 500) String observaciones) {
}
