import { Router } from "express";
import { prisma } from "../db";

const router = Router();

/**
 * =====================================================
 *  LISTAR FILIAIS DO USUÁRIO LOGADO
 *  GET /api/user-filiais
 * =====================================================
 */
router.get("/", async (req, res) => {
  try {
    // usuário vem do token (middleware de auth)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Usuário não autenticado" });
    }

    const permissoes = await prisma.userFilial.findMany({
      where: { userId },
      include: { filial: true },
    });

    const filiais = permissoes.map(p => p.filial);

    return res.json(filiais);

  } catch (error) {
    console.error("Erro ao buscar filiais do usuário:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});


/**
 * Vincular usuário a uma filial
 * POST /api/user-filiais
 */
router.post("/", async (req, res) => {
  try {
    const { userId, filialId } = req.body;

    if (!userId || !filialId) {
      return res.status(400).json({ error: "userId e filialId são obrigatórios" });
    }

    const vinculo = await prisma.userFilial.create({
      data: {
        userId,
        filialId,
      },
    });

    return res.status(201).json(vinculo);
  } catch (error: any) {
    console.error("Erro ao vincular usuário à filial:", error);

    if (error.code === "P2002") {
      return res.status(409).json({
        error: "Usuário já vinculado a esta filial",
      });
    }

    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;
