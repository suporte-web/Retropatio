import { db } from "./db";
import { filiais, users, vagas, userPermissions } from "@shared/schema";
import { hashPassword } from "./auth";
import { eq, and } from "drizzle-orm";

async function seed() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Create or update filiais
  console.log("Criando/atualizando filiais...");
  const filiaisData = [
    {
      nome: "Filial Guarulhos",
      codigo: "guarulhos",
      endereco: "Av. Presidente Juscelino K. de Oliveira, 5000 - Guarulhos/SP",
      ativo: true,
    },
    {
      nome: "Filial Araraquara",
      codigo: "araraquara",
      endereco: "Rodovia Washington Luís, Km 235 - Araraquara/SP",
      ativo: true,
    },
    {
      nome: "Filial Costeira",
      codigo: "costeira",
      endereco: "Via Anchieta, Km 18 - São Bernardo do Campo/SP",
      ativo: true,
    },
  ];

  const createdFiliais = [];
  for (const filialData of filiaisData) {
    const [existing] = await db.select().from(filiais).where(eq(filiais.codigo, filialData.codigo));
    
    if (existing) {
      console.log(`✓ Filial ${filialData.nome} já existe`);
      createdFiliais.push(existing);
    } else {
      const [f] = await db.insert(filiais).values(filialData).returning();
      createdFiliais.push(f);
      console.log(`✓ Filial ${f.nome} criada`);
    }
  }

  // Create or update users
  console.log("Criando/atualizando usuários...");
  
  const usersData = [
    {
      username: "admin",
      email: "admin@retropatio.com",
      password: await hashPassword("admin123"),
      nome: "Administrador",
      role: "gestor" as const,
      ativo: true,
    },
    {
      username: "porteiro",
      email: "porteiro@retropatio.com",
      password: await hashPassword("porteiro123"),
      nome: "João Silva - Porteiro",
      role: "porteiro" as const,
      ativo: true,
    },
    {
      username: "cliente",
      email: "cliente@retropatio.com",
      password: await hashPassword("cliente123"),
      nome: "Maria Santos - Cliente",
      role: "cliente" as const,
      ativo: true,
    },
  ];

  const createdUsers = [];
  for (const userData of usersData) {
    const [existing] = await db.select().from(users).where(eq(users.username, userData.username));
    
    if (existing) {
      console.log(`✓ Usuário ${userData.username} já existe`);
      createdUsers.push(existing);
    } else {
      const [u] = await db.insert(users).values(userData).returning();
      createdUsers.push(u);
      console.log(`✓ Usuário ${userData.username} criado (password: ${userData.username}123)`);
    }
  }

  // Create user permissions - associate users with all filiais
  console.log("Criando permissões de usuário por filial...");
  for (const user of createdUsers) {
    for (const filial of createdFiliais) {
      const [existing] = await db.select().from(userPermissions)
        .where(and(
          eq(userPermissions.userId, user.id),
          eq(userPermissions.filialId, filial.id)
        ));
      
      if (!existing) {
        await db.insert(userPermissions).values({
          userId: user.id,
          filialId: filial.id,
        });
        console.log(`✓ Permissão criada: ${user.username} → ${filial.codigo}`);
      } else {
        console.log(`✓ Permissão já existe: ${user.username} → ${filial.codigo}`);
      }
    }
  }

  // Create vagas for each filial if they don't exist
  console.log("Criando vagas...");
  for (const filial of createdFiliais) {
    const existingVagas = await db.select().from(vagas).where(eq(vagas.filialId, filial.id));
    
    if (existingVagas.length > 0) {
      console.log(`✓ Filial ${filial.nome} já tem ${existingVagas.length} vagas`);
    } else {
      for (let i = 1; i <= 20; i++) {
        await db.insert(vagas).values({
          filialId: filial.id,
          numero: `V${i.toString().padStart(3, '0')}`,
          status: "livre",
          descricao: `Vaga ${i} - ${filial.nome}`,
        });
      }
      console.log(`✓ 20 vagas criadas para ${filial.nome}`);
    }
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log("\n📋 Credenciais de acesso:");
  console.log("   Admin: username=admin, password=admin123");
  console.log("   Porteiro: username=porteiro, password=porteiro123");
  console.log("   Cliente: username=cliente, password=cliente123");
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erro ao executar seed:", error);
    process.exit(1);
  });
