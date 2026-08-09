-- V3__add_no_overlap_constraint.sql

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "reservation"
    ADD CONSTRAINT "no_overlap"
    EXCLUDE USING gist (
        id_equipment WITH =,
        tsrange(date_start_time, date_end_time) WITH &&
    ) WHERE (status = 'ACTIVE');