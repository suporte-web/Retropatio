import { Router } from "express";
import { prisma } from "../db";

const router = Router();

/**
 * Listar tipos de vaga
 */
router.get("/", async (_req, res) => {
  try {
    const tipos = await prisma.tipoVaga.findMany({
      orderBy: { Id: "asc" },
    });

    res.json(tipos);
  } catch (error) {
    console.error("Erro ao listar tipos de vaga:", error);
    res.status(500).json({ error: "Erro ao listar tipos de vaga" });
  }
});

/**
 * Criar tipo de vaga
 */
router.post("/", async (req, res) => {
  try {
    const { Nome } = req.body;

    const tipo = await prisma.tipoVaga.create({
      data: { Nome },
    });

    res.json({ message: "Tipo de vaga criado!", tipo });
  } catch (error) {
    console.error("Erro ao criar tipo de vaga:", error);
    res.status(500).json({ error: "Erro ao criar tipo de vaga" });
  }
});


/**
 * Atualizar tipo de vaga
 * PUT /api/tipo-vaga/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { Nome } = req.body;

    if (!Nome) {
      return res.status(400).json({ error: "Nome é obrigatório" });
    }

    const tipo = await prisma.tipoVaga.update({
      where: { Id: Number(id) },
      data: { Nome },
    });

    res.json({ message: "Tipo de vaga atualizado!", tipo });
  } catch (error: any) {
    console.error("Erro ao atualizar tipo de vaga:", error);
    res.status(500).json({
      error: error.message || "Erro ao atualizar tipo de vaga",
    });
  }
});



export default router;
