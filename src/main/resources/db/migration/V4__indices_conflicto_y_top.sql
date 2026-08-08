-- =====================================================================
-- V4: Performance indexes for conflict validation and Top-N statistics
-- Per docs/specs/04-database-spec.md "Indices criticos":
--   - reservas(id_equipo, estado, fecha_hora_inicio, fecha_hora_fin) -> overlap
--     validation (SELECT ... FOR UPDATE) AND range-date filters.
--     Its leftmost prefix (id_equipo, estado) also serves the Top-5 query.
--   - reservas(id_usuario) -> "Mis reservas" view.
--   - reservas(id_equipo)  -> per-equipment history.
--   - reservas(estado)     -> status filters.
--   - equipos(id_categoria), equipos(estado), equipos(nombre) -> listing filters.
--   - usuarios(correo)     -> UNIQUE already creates this; documented for clarity.
--   - log_actividad(fecha_hora), log_actividad(id_usuario) -> audit queries.
-- =====================================================================

-- reservas: overlap + top-N (composite, leftmost prefix covers id_equipo,estado)
CREATE INDEX idx_reservas_conflicto
    ON reservas (id_equipo, estado, fecha_hora_inicio, fecha_hora_fin);

CREATE INDEX idx_reservas_usuario ON reservas (id_usuario);
CREATE INDEX idx_reservas_equipo  ON reservas (id_equipo);
CREATE INDEX idx_reservas_estado  ON reservas (estado);

-- log_actividad audit lookups
CREATE INDEX idx_log_fecha   ON log_actividad (fecha_hora);
CREATE INDEX idx_log_usuario ON log_actividad (id_usuario);
