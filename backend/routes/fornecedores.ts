import { Router } from "express";
import { prisma } from "../db";

const router = Router();

/* ======================================================
    1) LISTAR FORNECEDORES POR FILIAL
    GET /api/fornecedores?filialId=xxxx
====================================================== */
router.get("/", async (req, res) => {
  try {
    const { filialId } = req.query;

    if (!filialId) {
      return res.status(400).json({ error: "filialId é obrigatório" });
    }

    const fornecedores = await prisma.fornecedor.findMany({
      where: { },
      orderBy: { nome: "asc" },
    });

    res.json(fornecedores);
  } catch (error) {
    console.error("Erro ao listar fornecedores:", error);
    res.status(500).json({ error: "Erro ao listar fornecedores" });
  }
});

/* ======================================================
    2) CRIAR FORNECEDOR
    POST /api/fornecedores
====================================================== */
router.post("/", async (req, res) => {
  try {
    const { nome, cnpj, ativo } = req.body;

    if (!nome || !cnpj) {
      return res.status(400).json({ error: "Nome e CNPJ são obrigatórios" });
    }

    const existente = await prisma.fornecedor.findUnique({ where: { cnpj } });

    if (existente) {
      return res.status(400).json({ error: "CNPJ já cadastrado" });
    }

    const fornecedor = await prisma.fornecedor.create({
      data: {
        nome,
        cnpj,
        ativo: ativo ?? true,
      },
    });

    res.json(fornecedor);
  } catch (error) {
    console.error("Erro ao criar fornecedor:", error);
    res.status(500).json({ error: "Erro ao criar fornecedor" });
  }
});

/* ======================================================
    3) ATUALIZAR FORNECEDOR
    PATCH /api/fornecedores/:id
====================================================== */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const dados = req.body;

    const fornecedor = await prisma.fornecedor.update({
      where: { id },
      data: dados,
    });

    res.json(fornecedor);
  } catch (error) {
    console.error("Erro ao atualizar fornecedor:", error);
    res.status(500).json({ error: "Erro ao atualizar fornecedor" });
  }
});

/* ======================================================
    4) REMOVER FORNECEDOR
    DELETE /api/fornecedores/:id
====================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.fornecedor.delete({
      where: { id },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Erro ao remover fornecedor:", error);
    res.status(500).json({ error: "Erro ao remover fornecedor" });
  }
});

export default router;
