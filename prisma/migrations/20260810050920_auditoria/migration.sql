-- CreateTable
CREATE TABLE "auditoria" (
    "id" TEXT NOT NULL,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidad_id" TEXT,
    "detalle" TEXT NOT NULL,
    "actor_nombre" TEXT NOT NULL,
    "actor_correo" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_accion_creado_en_idx" ON "auditoria"("accion", "creado_en");
