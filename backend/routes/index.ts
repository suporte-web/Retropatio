import { Express } from "express";
import authRouter from "../auth/auth";
import filiaisRouter from "./filiais";
import vagasRouter from "./vagas";
import tipoVagaRouter from "./tipoVaga";
import entradaRoutes from "./entrada";
import visitantesRouter from "./visitantes";
import veiculosRouter from "./veiculos";
import usersRouter from "./user";
import fornecedoresRoutes from "./fornecedores";
import userFiliaisRouter from "./userFiliais";
import notificacoesRouter from "./notificacoes";
import auditLogsRouter from "./auditLogs";
import { prisma } from "../db";

export async function registerRoutes(app: Express) {
  // ============================
  // AUTENTICAÇÃO
  // ============================
  app.use("/api/auth", authRouter);

  // ============================
  // VAGAS
  // ============================
  app.use("/api/vagas", vagasRouter);

  // 👉 TIPOS DE VAGA (ESTAVA FALTANDO)
  app.use("/api/tipo-vaga", tipoVagaRouter);

  // ============================
  // FILIAIS
  // ============================
  app.use("/api/filiais", filiaisRouter);

  // ============================
  // VISITANTES
  // ============================
  app.use("/api/visitantes", visitantesRouter);

  // ============================
  // ENTRADAS DE VEÍCULOS
  // ============================
  app.use("/api/entrada", entradaRoutes);

  // ============================
  // VEÍCULOS
  // ============================
  app.use("/api/veiculos", veiculosRouter);

  // ============================
  // USUÁRIOS
  // ============================
  app.use("/api/users", usersRouter);

  // ============================
  // FORNECEDORES
  // ============================
  app.use("/api/fornecedores", fornecedoresRoutes);

  // ============================
  // USUÁRIOS x FILIAIS
  // ============================
  app.use("/api/user-filiais", userFiliaisRouter);

  // ============================
  // NOTIFICAÇÕES
  // ============================
  app.use("/api/notifications", notificacoesRouter);

  // ============================
  // AUDITORIA
  // ============================
  app.use("/api/audit-logs", auditLogsRouter);

  // =====================================================
  // 🔹 IDs de filiais que o usuário pode visualizar
  // GET /api/user-filiais
  // =====================================================
  app.get("/api/user-filiais", async (_req, res) => {
    try {
      const filiais = await prisma.filial.findMany({
        select: { id: true },
      });

      return res.json(filiais.map((f) => f.id));
    } catch (error) {
      console.error("Erro ao buscar filiais do usuário:", error);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  });

  // =====================================================
  // 🔹 Remover permissão (UserFilial)
  // DELETE /api/user-permissions/:id
  // =====================================================
  app.delete("/api/user-permissions/:id", async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.userFilial.delete({
        where: { id },
      });

      return res.json({ message: "Permissão removida" });
    } catch (error) {
      console.error("Erro ao remover permissão:", error);
      return res.status(500).json({ error: "Erro interno no servidor" });
    }
  });

  return app;
}
