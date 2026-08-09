-- V1__create_equipment_table.sql

CREATE TABLE "equipment" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(150) NOT NULL,
	"mac_serial_number" varchar(100) NOT NULL CONSTRAINT "equipment_mac_serial_number_key" UNIQUE,
	"category" varchar(50) NOT NULL,
	"status" varchar(30) NOT NULL,
	"registration_date" timestamp DEFAULT now(),
	"update_date" timestamp
);

CREATE INDEX "idx_equipment_category" ON "equipment" ("category");
CREATE INDEX "idx_equipment_status" ON "equipment" ("status");