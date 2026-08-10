-- CreateEnum
CREATE TYPE "CategoriaForo" AS ENUM ('EXPERIENCIAS', 'CREACIONES', 'CONSEJOS', 'METODOLOGIAS');

-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "equipados" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "mascota_nombre" TEXT NOT NULL DEFAULT 'Lis',
ADD COLUMN     "mascota_xp" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "regalo_bienvenida" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "regalo_foro" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "objetos_usuario" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "obtenido_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "objetos_usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicaciones" (
    "id" TEXT NOT NULL,
    "autor_id" TEXT NOT NULL,
    "autor_nombre" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "categoria" "CategoriaForo" NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "objetos_usuario_usuario_id_clave_key" ON "objetos_usuario"("usuario_id", "clave");

-- CreateIndex
CREATE INDEX "publicaciones_categoria_creada_en_idx" ON "publicaciones"("categoria", "creada_en");

-- AddForeignKey
ALTER TABLE "objetos_usuario" ADD CONSTRAINT "objetos_usuario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_autor_id_fkey" FOREIGN KEY ("autor_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
