-- =====================================================================
-- V8: user roles
--
-- Until now every authenticated user had exactly the same authority. The
-- lab actually has three of them:
--
--   ESTUDIANTE — books equipment for themselves (the default).
--   AUXILIAR   — staffs the loan desk: hands equipment over, receives it
--                back, marks no-shows and flags equipment for maintenance.
--   ADMIN      — owns the catalog and the people: equipment CRUD, role
--                assignment and sanctions.
--
-- The column is NOT NULL DEFAULT 'ESTUDIANTE' so every existing row (and
-- every future Google SSO sign-up) lands on the least-privileged role and
-- has to be promoted explicitly. Privilege is granted, never inherited.
-- =====================================================================

ALTER TABLE usuarios
    ADD COLUMN rol ENUM('ESTUDIANTE','AUXILIAR','ADMIN')
        NOT NULL DEFAULT 'ESTUDIANTE'
        COMMENT 'Authority level; promoted explicitly by an ADMIN';

CREATE INDEX idx_usuarios_rol ON usuarios (rol);

-- Demo bootstrap so the evaluator can exercise both consoles right away.
-- In production the first ADMIN is seeded from the reservas.auth.roles.admins
-- property instead (see ReservasProperties), which is env-var driven.
UPDATE usuarios SET rol = 'ADMIN'    WHERE correo = 'isaac.mesag@udea.edu.co';
UPDATE usuarios SET rol = 'AUXILIAR' WHERE correo = 'ana.torres@udea.edu.co';
