/*
  Warnings:

  - You are about to drop the column `placa` on the `Veiculo` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Veiculo` table. All the data in the column will be lost.
  - You are about to drop the column `tipo` on the `Veiculo` table. All the data in the column will be lost.
  - Added the required column `dataEntrada` to the `Veiculo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `placaCavalo` to the `Veiculo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `situacao` to the `Veiculo` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Veiculo_placa_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "nome" TEXT;

-- AlterTable
ALTER TABLE "Vaga" ADD COLUMN     "status" TEXT DEFAULT 'livre';

-- AlterTable
ALTER TABLE "Veiculo" DROP COLUMN "placa",
DROP COLUMN "status",
DROP COLUMN "tipo",
ADD COLUMN     "cliente" TEXT,
ADD COLUMN     "cpfMotorista" TEXT,
ADD COLUMN     "cte" TEXT,
ADD COLUMN     "dataEntrada" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "dataSaida" TIMESTAMP(3),
ADD COLUMN     "lacre" TEXT,
ADD COLUMN     "nf" TEXT,
ADD COLUMN     "placaCarreta" TEXT,
ADD COLUMN     "placaCavalo" TEXT NOT NULL,
ADD COLUMN     "situacao" TEXT NOT NULL,
ADD COLUMN     "transportadora" TEXT;

-- CreateTable
CREATE TABLE "Entrada" (
    "id" SERIAL NOT NULL,
    "filialId" TEXT NOT NULL,
    "vagaId" INTEGER NOT NULL,
    "placaCavalo" TEXT NOT NULL,
    "placaCarreta" TEXT,
    "motorista" TEXT NOT NULL,
    "proprietario" TEXT,
    "tipo" TEXT NOT NULL,
    "tipoVeiculoCategoria" TEXT,
    "tipoProprietario" TEXT,
    "cliente" TEXT,
    "transportadora" TEXT,
    "statusCarga" TEXT,
    "doca" TEXT,
    "valor" DOUBLE PRECISION,
    "cte" TEXT,
    "nf" TEXT,
    "lacre" TEXT,
    "cpfMotorista" TEXT,
    "observacoes" TEXT,
    "multi" BOOLEAN DEFAULT false,
    "status" TEXT DEFAULT 'ativo',
    "dataEntrada" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
    "dataSaida" TIMESTAMP(3),
    "veiculoId" TEXT,

    CONSTRAINT "Entrada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitante" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "empresa" TEXT,
    "tipoVisita" TEXT NOT NULL,
    "motivoVisita" TEXT,
    "status" TEXT DEFAULT 'aguardando',
    "dataEntrada" TIMESTAMP(6),
    "dataSaida" TIMESTAMP(6),
    "filialId" TEXT NOT NULL,

    CONSTRAINT "Visitante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserFilial" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "filialId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFilial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Fornecedor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Fornecedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "dadosAntes" TEXT,
    "dadosDepois" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_visitante_cpf" ON "Visitante"("cpf");

-- CreateIndex
CREATE INDEX "idx_visitante_filial" ON "Visitante"("filialId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFilial_userId_filialId_key" ON "UserFilial"("userId", "filialId");

-- CreateIndex
CREATE UNIQUE INDEX "Fornecedor_cnpj_key" ON "Fornecedor"("cnpj");

-- AddForeignKey
ALTER TABLE "Entrada" ADD CONSTRAINT "Entrada_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrada" ADD CONSTRAINT "Entrada_vagaId_fkey" FOREIGN KEY ("vagaId") REFERENCES "Vaga"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrada" ADD CONSTRAINT "Entrada_veiculoId_fkey" FOREIGN KEY ("veiculoId") REFERENCES "Veiculo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitante" ADD CONSTRAINT "fk_visitante_filial" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserFilial" ADD CONSTRAINT "UserFilial_filialId_fkey" FOREIGN KEY ("filialId") REFERENCES "Filial"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "UserFilial" ADD CONSTRAINT "UserFilial_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
