-- CreateTable
CREATE TABLE "TipoVaga" (
    "id" SERIAL NOT NULL,
    "nome" VARCHAR(100) NOT NULL,

    CONSTRAINT "TipoVaga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaga" (
    "id" SERIAL NOT NULL,
    "codigoVaga" VARCHAR(50) NOT NULL,
    "descricao" TEXT,
    "salario" DOUBLE PRECISION,
    "filialId" TEXT NOT NULL,
    "tipoVagaId" INTEGER NOT NULL,

    CONSTRAINT "Vaga_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TipoVaga_nome_key" ON "TipoVaga"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Vaga_codigoVaga_key" ON "Vaga"("codigoVaga");

-- AddForeignKey
ALTER TABLE "Vaga" ADD CONSTRAINT "Vaga_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaga" ADD CONSTRAINT "Vaga_tipoVagaId_fkey" FOREIGN KEY ("tipoVagaId") REFERENCES "TipoVaga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
