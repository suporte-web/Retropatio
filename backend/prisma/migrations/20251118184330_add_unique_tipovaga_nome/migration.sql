/*
  Warnings:

  - The primary key for the `TipoVaga` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `TipoVaga` table. All the data in the column will be lost.
  - You are about to drop the column `nome` on the `TipoVaga` table. All the data in the column will be lost.
  - You are about to drop the column `codigoVaga` on the `Vaga` table. All the data in the column will be lost.
  - You are about to drop the column `descricao` on the `Vaga` table. All the data in the column will be lost.
  - You are about to drop the column `salario` on the `Vaga` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[Nome]` on the table `TipoVaga` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `Nome` to the `TipoVaga` table without a default value. This is not possible if the table is not empty.
  - Added the required column `NomeVaga` to the `Vaga` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Vaga" DROP CONSTRAINT "Vaga_tipoVagaId_fkey";

-- DropIndex
DROP INDEX "TipoVaga_nome_key";

-- DropIndex
DROP INDEX "Vaga_codigoVaga_key";

-- AlterTable
ALTER TABLE "TipoVaga" DROP CONSTRAINT "TipoVaga_pkey",
DROP COLUMN "id",
DROP COLUMN "nome",
ADD COLUMN     "Id" SERIAL NOT NULL,
ADD COLUMN     "Nome" VARCHAR(100) NOT NULL,
ADD CONSTRAINT "TipoVaga_pkey" PRIMARY KEY ("Id");

-- AlterTable
ALTER TABLE "Vaga" DROP COLUMN "codigoVaga",
DROP COLUMN "descricao",
DROP COLUMN "salario",
ADD COLUMN     "NomeVaga" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "Veiculo" ADD COLUMN     "vagaId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "TipoVaga_Nome_key" ON "TipoVaga"("Nome");

-- AddForeignKey
ALTER TABLE "Veiculo" ADD CONSTRAINT "Veiculo_vagaId_fkey" FOREIGN KEY ("vagaId") REFERENCES "Vaga"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaga" ADD CONSTRAINT "Vaga_tipoVagaId_fkey" FOREIGN KEY ("tipoVagaId") REFERENCES "TipoVaga"("Id") ON DELETE RESTRICT ON UPDATE CASCADE;
