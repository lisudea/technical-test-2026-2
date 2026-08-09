-- V2__create_reservation_table.sql

CREATE TABLE "reservation" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"id_equipment" bigint NOT NULL,
	"id_user" bigint NOT NULL,
	"date_start_time" timestamp NOT NULL,
	"date_end_time" timestamp NOT NULL,
	"status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"creation_date" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "chk_reservation_dates" CHECK (date_end_time > date_start_time),
	CONSTRAINT "reservation_id_equipment_fkey" FOREIGN KEY ("id_equipment") REFERENCES "equipment"("id"),
	CONSTRAINT "reservation_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "users"("id")
);

CREATE INDEX "idx_reservation_equipment_status_dates"
    ON "reservation" ("id_equipment", "status", "date_start_time", "date_end_time");