import { Router } from "express";
import { prisma } from "../db";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// 🔐 Todas as rotas de filiais exigem autenticação
router.use(authMiddleware);

/**
 * 1️⃣ Filiais permitidas do usuário logado
 * GET /api/filiais/perfil
 * (DEVE vir antes de qualquer rota com :id)
 */
router.get("/perfil", async (req: any, res) => {
  try {
    const userId = req.user?.id;

    const permissoes = await prisma.userFilial.findMany({
      where: { userId },
      include: {
        filial: { select: { id: true, nome: true, codigo: true } }
      }
    });

    const filiais = permissoes.map(p => p.filial);

    return res.json(filiais);

  } catch (error) {
    console.error("Erro ao carregar filiais permitidas:", error);
    res.status(500).json({ error: "Erro interno ao buscar filiais" });
  }
});



/**
 * 2️⃣ Criar uma filial
 * POST /api/filiais
 */
router.post("/", async (req, res) => {
  try {
    const { nome, codigo, endereco, ativo } = req.body;

    const filial = await prisma.filial.create({
      data: {
        nome,
        codigo: String(codigo),
        endereco,
        ativo: ativo ?? true,
      },
    });

    return res.json({ message: "Filial criada com sucesso!", filial });
  } catch (error) {
    console.error("Erro ao criar filial:", error);
    res.status(500).json({ error: "Erro ao criar filial" });
  }
});



/**
 * 3️⃣ Listar todas as filiais
 * GET /api/filiais
 */
router.get("/", async (_req, res) => {
  try {
    const filiais = await prisma.filial.findMany({
      orderBy: { nome: "asc" },
    });

    return res.json(filiais);
  } catch (error) {
    console.error("Erro ao listar filiais:", error);
    res.status(500).json({ error: "Erro ao listar filiais" });
  }
});



/**
 * 4️⃣ Buscar filial por ID
 * GET /api/filiais/:id
 * (DEVE vir DEPOIS de /perfil e depois de /)
 */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const filial = await prisma.filial.findUnique({
      where: { id },
    });

    if (!filial) {
      return res.status(404).json({ error: "Filial não encontrada" });
    }

    return res.json(filial);
  } catch (error) {
    console.error("Erro ao buscar filial:", error);
    res.status(500).json({ error: "Erro ao buscar filial" });
  }
});



/**
 * 5️⃣ Editar filial
 * PUT /api/filiais/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, codigo, endereco, ativo } = req.body;

    const filial = await prisma.filial.update({
      where: { id },
      data: {
        nome,
        codigo: String(codigo),
        endereco,
        ...(typeof ativo === "boolean" ? { ativo } : {}),
      },
    });

    return res.json({ message: "Filial atualizada com sucesso!", filial });
  } catch (error) {
    console.error("Erro ao atualizar filial:", error);
    res.status(500).json({ error: "Erro ao atualizar filial" });
  }
});



/**
 * 6️⃣ Desativar filial
 * PUT /api/filiais/:id/desativar
 */
router.put("/:id/desativar", async (req, res) => {
  try {
    const { id } = req.params;

    const filial = await prisma.filial.update({
      where: { id },
      data: { ativo: false },
    });

    return res.json({
      message: "Filial desativada com sucesso!",
      filial,
    });
  } catch (error: any) {
    console.error("Erro ao desativar filial:", error);
    res.status(500).json({
      error: error.message || "Erro ao desativar filial",
      meta: error.meta,
    });
  }
});



/**
 * 7️⃣ Ativar filial
 * PUT /api/filiais/:id/ativar
 */
router.put("/:id/ativar", async (req, res) => {
  try {
    const { id } = req.params;

    const filial = await prisma.filial.update({
      where: { id },
      data: { ativo: true },
    });

    return res.json({
      message: "Filial ativada com sucesso!",
      filial,
    });

  } catch (error) {
    console.error("Erro ao ativar filial:", error);
    res.status(500).json({ error: "Erro ao ativar filial" });
  }
});



/**
 * 8️⃣ Excluir filial
 * DELETE /api/filiais/:id
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const filial = await prisma.filial.findUnique({ where: { id } });

    if (!filial) {
      return res.status(404).json({ error: "Filial não encontrada" });
    }

    const dependencias = await prisma.$transaction([
      prisma.vaga.count({ where: { filialId: id } }),
      prisma.entrada.count({ where: { filialId: id } }),
      prisma.visitante.count({ where: { filialId: id } }),
      prisma.userFilial.count({ where: { filialId: id } }),
    ]);

    const total = dependencias.reduce((acc, n) => acc + n, 0);

    if (total > 0) {
      return res.status(400).json({
        error: "Não é possível excluir: há registros vinculados à filial.",
        detalhes: {
          vagas: dependencias[0],
          entradas: dependencias[1],
          visitantes: dependencias[2],
          permissoes: dependencias[3],
        }
      });
    }

    await prisma.filial.delete({ where: { id } });

    return res.json({ message: "Filial excluída com sucesso!" });

  } catch (error) {
    console.error("Erro ao excluir filial:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});

export default router;
