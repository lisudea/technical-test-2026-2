-- Migration to add exclusion constraint to prevent overlapping ACTIVE reservations in PostgreSQL
-- Requires superuser privileges to CREATE EXTENSION; run this migration only on PostgreSQL environments.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE reservation
  ADD CONSTRAINT reservation_no_overlap
  EXCLUDE USING GIST (
    equipment_id WITH =,
    tstzrange(start_at, end_at) WITH &&
  )
  WHERE (reservation_status_id = 1);
