-- Segunda capa de defensa contra reservas solapadas, a nivel de base de datos:
-- ni un bug de la aplicación podría insertar dos reservas activas cruzadas.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "reservas"
  ADD CONSTRAINT "reservas_sin_solapamiento"
  EXCLUDE USING gist (
    "equipo_id" WITH =,
    tsrange("inicio", "fin") WITH &&
  )
  WHERE ("estado" = 'ACTIVA');
