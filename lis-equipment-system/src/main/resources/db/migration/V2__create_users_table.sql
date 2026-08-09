-- V5__create_users_table.sql

CREATE TABLE "users" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" varchar(150) NOT NULL,
	"email" varchar(150) NOT NULL CONSTRAINT "users_email_key" UNIQUE,
	"role" varchar(20) DEFAULT 'USER' NOT NULL,
	"registration_date" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "idx_users_email" ON "users" ("email");