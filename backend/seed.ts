import "dotenv/config";
import { prisma } from "../server/db/prisma";
import { hashPassword } from "../server/auth/password";

async function main() {
  // Filiais
  await prisma.filial.createMany({
    data: [
      { nome: "Guarulhos",  codigo: "guarulhos",  endereco: "Guarulhos - SP" },
      { nome: "Araraquara", codigo: "araraquara", endereco: "Araraquara - SP" },
      { nome: "Costeira",   codigo: "costeira",   endereco: "São José - SC" },
    ],
    skipDuplicates: true,
  });

  // Pega uma filial pra vincular usuários (pega a primeira)
  const filial = await prisma.filial.findFirst();

  // Senha padrão
  const pw = await hashPassword("123456");

  // Usuários
  await prisma.user.upsert({
    where: { username: "admin" },
    create: {
      username: "admin",
      email: "admin@teste.com",
      password: pw,
      role: "gestor", // ou "admin", conforme seu front espera
      ativo: true,
      filialId: filial?.id ?? null,
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { username: "porteiro" },
    create: {
      username: "porteiro",
      email: "porteiro@teste.com",
      password: pw,
      role: "porteiro",
      ativo: true,
      filialId: filial?.id ?? null,
    },
    update: {},
  });

  await prisma.user.upsert({
    where: { username: "cliente" },
    create: {
      username: "cliente",
      email: "cliente@teste.com",
      password: pw,
      role: "cliente",
      ativo: true,
      filialId: filial?.id ?? null,
    },
    update: {},
  });

  console.log("✅ Seed OK: filiais + usuários criados/atualizados");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
