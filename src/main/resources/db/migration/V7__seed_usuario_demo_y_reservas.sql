-- =====================================================================
-- V7__seed_usuario_demo_y_reservas.sql
-- Adds one extra demo usuario and five extra reservas so the dashboard,
-- the Top-N view and the loan desk have a richer dataset.
--
-- These rows were originally appended to V5 by hand. That broke the Flyway
-- checksum of an already-applied migration on the deployed RDS instance, so
-- they were moved here: an applied migration is immutable, new data always
-- arrives in a new version.
--
-- Idempotent: re-running against a database that already has the rows is a
-- no-op, so it is safe to apply after a `flyway repair`.
-- =====================================================================

INSERT INTO usuarios (nombre, correo)
SELECT 'Isaac Mesa Gomez', 'isaac.mesag@udea.edu.co'
WHERE NOT EXISTS (
    SELECT 1 FROM usuarios WHERE correo = 'isaac.mesag@udea.edu.co'
);

INSERT INTO reservas (id_equipo, id_usuario, fecha_hora_inicio, fecha_hora_fin, estado, motivo)
SELECT * FROM (
    SELECT  9, u.id_usuario, '2026-08-12 08:00:00', '2026-08-12 12:00:00', 'ACTIVA',     'Impresion de prototipo mecanico' FROM usuarios u WHERE u.correo = 'isaac.mesag@udea.edu.co'
    UNION ALL
    SELECT  7, u.id_usuario, '2026-08-14 14:00:00', '2026-08-14 18:00:00', 'ACTIVA',     'Taller de redes'                 FROM usuarios u WHERE u.correo = 'isaac.mesag@udea.edu.co'
    UNION ALL
    SELECT  1, u.id_usuario, '2026-08-15 09:00:00', '2026-08-15 11:00:00', 'ACTIVA',     'Practica Arduino basico'         FROM usuarios u WHERE u.correo = 'juan.restrepo@udea.edu.co'
    UNION ALL
    SELECT  5, u.id_usuario, '2026-08-07 10:00:00', '2026-08-07 12:00:00', 'COMPLETADA', 'Prueba de VR'                    FROM usuarios u WHERE u.correo = 'maria.gomez@udea.edu.co'
    UNION ALL
    SELECT  4, u.id_usuario, '2026-08-18 16:00:00', '2026-08-18 18:00:00', 'ACTIVA',     'Demo de realidad virtual'        FROM usuarios u WHERE u.correo = 'ana.torres@udea.edu.co'
) AS nuevas (id_equipo, id_usuario, fecha_hora_inicio, fecha_hora_fin, estado, motivo)
WHERE NOT EXISTS (
    SELECT 1 FROM reservas r
    WHERE r.id_equipo = nuevas.id_equipo
      AND r.id_usuario = nuevas.id_usuario
      AND r.fecha_hora_inicio = nuevas.fecha_hora_inicio
);
