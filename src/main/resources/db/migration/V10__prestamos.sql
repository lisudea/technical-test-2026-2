-- =====================================================================
-- V10: loan lifecycle on reservas
--
-- A reservation and a loan are two different lifecycles on the same row,
-- and conflating them was tempting but wrong:
--
--   estado          — the BOOKING: ACTIVA / CANCELADA / COMPLETADA. It is
--                     what the overlap check reads, and only ACTIVA rows
--                     occupy a time slot.
--   estado_prestamo — the PHYSICAL HAND-OVER: did the equipment actually
--                     leave the counter, and did it come back?
--
-- Folding "ENTREGADO" into `estado` would have forced the conflict query to
-- grow a second ACTIVA-equivalent value, and every existing index, view and
-- test that reads `estado = 'ACTIVA'` would have silently started missing
-- rows. Two orthogonal facts, two columns.
--
-- The transitions the auxiliar console can perform:
--   PENDIENTE -> ENTREGADO     (hand-over validated at the counter)
--   ENTREGADO -> DEVUELTO      (returned; booking becomes COMPLETADA)
--   PENDIENTE -> NO_RECLAMADO  (no-show; booking becomes CANCELADA and the
--                               slot is freed for someone else)
-- =====================================================================

ALTER TABLE reservas
    ADD COLUMN estado_prestamo ENUM('PENDIENTE','ENTREGADO','DEVUELTO','NO_RECLAMADO')
        NOT NULL DEFAULT 'PENDIENTE'
        COMMENT 'Physical hand-over lifecycle, independent of the booking estado',
    ADD COLUMN fecha_entrega          DATETIME NULL,
    ADD COLUMN fecha_devolucion       DATETIME NULL,
    ADD COLUMN entregado_por          INT NULL COMMENT 'Auxiliar who handed the equipment over',
    ADD COLUMN recibido_por           INT NULL COMMENT 'Auxiliar who took the equipment back',
    ADD COLUMN observaciones_prestamo VARCHAR(500) NULL
        COMMENT 'Condition notes recorded at hand-over or return';

ALTER TABLE reservas
    ADD CONSTRAINT fk_reservas_entregado_por
        FOREIGN KEY (entregado_por) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL,
    ADD CONSTRAINT fk_reservas_recibido_por
        FOREIGN KEY (recibido_por) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL;

-- Backfill: bookings already marked COMPLETADA by the old flow did happen
-- physically, so they are DEVUELTO. CANCELADA ones never left the counter,
-- so they stay PENDIENTE rather than being retro-labelled as no-shows —
-- inventing history the system never observed would poison the statistics.
UPDATE reservas SET estado_prestamo = 'DEVUELTO' WHERE estado = 'COMPLETADA';

-- Drives the auxiliar's daily queue: "today's bookings, pending first".
CREATE INDEX idx_reservas_agenda
    ON reservas (fecha_hora_inicio, estado_prestamo, estado);
