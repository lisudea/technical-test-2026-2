-- CreateTable
CREATE TABLE "tokens_refresh" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "hash_token" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "revocado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_refresh_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokens_recuperacion" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "hash_token" TEXT NOT NULL,
    "expira_en" TIMESTAMP(3) NOT NULL,
    "usado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tokens_recuperacion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_refresh_hash_token_key" ON "tokens_refresh"("hash_token");

-- CreateIndex
CREATE UNIQUE INDEX "tokens_recuperacion_hash_token_key" ON "tokens_recuperacion"("hash_token");

-- AddForeignKey
ALTER TABLE "tokens_refresh" ADD CONSTRAINT "tokens_refresh_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tokens_recuperacion" ADD CONSTRAINT "tokens_recuperacion_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
