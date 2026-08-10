-- CreateEnum
CREATE TYPE "CategoriaEquipo" AS ENUM ('MICROCONTROLADORES', 'VR', 'REDES', 'COMPUTO', 'IMPRESION_3D');

-- CreateEnum
CREATE TYPE "EstadoEquipo" AS ENUM ('DISPONIBLE', 'RESERVADO', 'MANTENIMIENTO');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('ACTIVA', 'CANCELADA');

-- CreateTable
CREATE TABLE "equipos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "categoria" "CategoriaEquipo" NOT NULL,
    "estado" "EstadoEquipo" NOT NULL DEFAULT 'DISPONIBLE',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "equipo_id" TEXT NOT NULL,
    "nombre_usuario" TEXT NOT NULL,
    "correo_usuario" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3) NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'ACTIVA',
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "equipos_serial_key" ON "equipos"("serial");

-- CreateIndex
CREATE INDEX "reservas_equipo_id_inicio_fin_idx" ON "reservas"("equipo_id", "inicio", "fin");

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
