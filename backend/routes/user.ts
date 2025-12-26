import bcrypt from "bcrypt";
import { Router } from "express";
import { prisma } from "../db";
import { v4 as uuid } from "uuid";



const router = Router();

/**
 * =====================================================
 * 1) LISTAR USUÁRIOS
 * GET /api/users
 * =====================================================
 */
router.get("/", async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        permissoes: {
          include: {
            filial: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return res.json(users);
  } catch (error) {
    console.error("Erro ao listar usuários:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});




/**
 * =====================================================
 * 2) CRIAR USUÁRIO
 * POST /api/users
 * =====================================================
 */
router.post("/", async (req, res) => {
  try {
    const { nome, username, email, password, role, filialId } = req.body;

    if (!nome || !username || !email || !password || !role) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    const hashedPass = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        nome,
        username,
        email,
        password: hashedPass,
        role,

      }
    });

    return res.status(201).json({
      message: "Usuário criado com sucesso",
      user: newUser,
    });

  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);

    if (error.code === "P2002") {
      return res.status(409).json({ error: "Email ou username já estão em uso" });
    }

    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});


/**
 * =====================================================
 * 3) ATUALIZAR USUÁRIO
 * PUT /api/users/:id
 * =====================================================
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, username, email, password, role, filialId } = req.body;

    const updateData: any = {
      nome,
      username,
      email,
      role,
    };

    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
    });

    return res.json({
      message: "Usuário atualizado com sucesso",
      user: updated,
    });

  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});


/**
 * =====================================================
 * 4) ATIVAR / DESATIVAR USUÁRIO
 * PATCH /api/users/:id/ativo
 * =====================================================
 */
router.patch("/:id/ativo", async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;

    if (typeof ativo !== "boolean") {
      return res.status(400).json({ error: "Campo 'ativo' deve ser booleano" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { ativo }
    });

    return res.json({
      message: "Status atualizado",
      user: updated
    });

  } catch (error) {
    console.error("Erro ao atualizar status do usuário:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});


/**
 * =====================================================
 * 5) ATUALIZAR SENHA
 * PUT /api/users/:id/senha
 * =====================================================
 */
router.put("/:id/senha", async (req, res) => {
  try {
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;

    if (!novaSenha) {
      return res.status(400).json({ error: "Nova senha é obrigatória" });
    }

    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    if (senhaAtual) {
      const ok = await bcrypt.compare(senhaAtual, user.password);
      if (!ok) {
        return res.status(401).json({ error: "Senha atual incorreta" });
      }
    }

    const hash = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id },
      data: { password: hash }
    });

    return res.json({ message: "Senha atualizada com sucesso" });

  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});


/**
 * =====================================================
 * 6) EXCLUIR USUÁRIO
 * DELETE /api/users/:id
 * =====================================================
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verifica se o usuário existe
    const user = await prisma.user.findUnique({ where: { id } });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Deletar permissões relacionadas antes (evita erro de FK)
    await prisma.userFilial.deleteMany({
      where: { userId: id }
    });

    // Deletar o usuário
    await prisma.user.delete({
      where: { id }
    });

    return res.json({ message: "Usuário excluído permanentemente" });

  } catch (error: any) {
    console.error("Erro ao excluir usuário:", error);

    return res.status(500).json({
      error: error.message || "Erro interno no servidor",
      meta: error.meta,
      stack: error.stack
    });
  }
});



/**
 * =====================================================
 * 7) ADICIONAR PERMISSÃO DE FILIAL
 * POST /api/users/:id/permissions
 * =====================================================
 */
 router.post("/:id/permissions", async (req, res) => {
  try {
    const { id } = req.params;
    const { filialId } = req.body;

    const perm = await prisma.userFilial.create({
      data: {
        userId: id,
        filialId
      }
    });

    return res.json(perm);

  } catch (error) {
    console.error("Erro ao adicionar permissão:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});




/**
 * =====================================================
 * 8) REMOVER PERMISSÃO
 * DELETE /api/users/permissions/:id
 * =====================================================
 */
router.delete("/permissions/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se existe
    const exists = await prisma.userFilial.findUnique({
      where: { id }
    });

    if (!exists) {
      return res.status(404).json({ error: "Permissão não encontrada" });
    }

    // Deletar
    await prisma.userFilial.delete({
      where: { id }
    });

    return res.json({ message: "Permissão removida" });

  } catch (error) {
    console.error("Erro ao remover permissão:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});



/**
 * =====================================================
 * 9) LISTAR PERMISSÕES DO USUÁRIO
 * GET /api/users/:id/permissions
 * =====================================================
 */
router.get("/:id/permissions", async (req, res) => {
  try {
    const { id } = req.params;

    const permissions = await prisma.userFilial.findMany({
      where: { userId: id },
      include: {
        filial: true
      }
    });

    return res.json(permissions);

  } catch (error) {
    console.error("Erro ao buscar permissões:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});


/**
 * =====================================================
 *  EDITAR USUÁRIO
 *  PUT /api/users/:id
 * =====================================================
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, username, email, role } = req.body;

    // Valida campos obrigatórios
    if (!nome || !username || !email || !role) {
      return res.status(400).json({ error: "Campos obrigatórios faltando" });
    }

    // Valida role permitida
    const validRoles = ["porteiro", "admin", "cliente", "gestor"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        error: "Role inválida. Utilize: porteiro, admin, cliente, gestor",
      });
    }

    // Verifica se o usuário existe
    const existingUser = await prisma.user.findUnique({ where: { id } });

    if (!existingUser) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    // Atualiza somente os dados do usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        nome,
        username,
        email,
        role,
      },
    });

    return res.json({
      message: "Usuário atualizado com sucesso!",
      user: updatedUser,
    });

  } catch (error) {
    console.error("Erro ao editar usuário:", error);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});



export default router;
