import { Router } from "express";

const notificacoesRouter = Router();

notificacoesRouter.get("/unread-count", async (_req, res) => {
  try {
    return res.json({ count: 0 });
  } catch (error) {
    console.error("Erro em unread-count:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// ESSA LINHA É O QUE ESTAVA FALTANDO
export default notificacoesRouter;
