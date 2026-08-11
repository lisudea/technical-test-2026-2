package com.lis.reservas.sancion.dto;

import jakarta.validation.constraints.Size;

/**
 * Request body for {@code PATCH /api/v1/sanciones/{id}/levantar} (ADMIN only).
 *
 * <p>The observation is optional but strongly encouraged: lifting a sanction
 * early is a judgement call, and the record should say why.
 *
 * @param observacion free-text justification for the early lift
 */
public record LevantarSancionRequest(@Size(max = 255) String observacion) {
}
