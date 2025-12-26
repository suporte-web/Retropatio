import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "segredo_teste_super_seguro";

// =====================================================
// LOGIN
// =====================================================
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email e senha são obrigatórios" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        permissoes: {
          include: { filial: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: "Senha incorreta" });
    }

    // 🔥 Montar lista REAL de filiais autorizadas
    const filiais = user.permissoes.map(p => ({
      id: p.filial.id,
      nome: p.filial.nome,
      codigo: p.filial.codigo
    }));

    // 🔥 Token agora inclui as filiais completas

    const token = jwt.sign(
    {
      id: user.id,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: "8h" }
  );



    return res.json({
      message: "Login bem-sucedido",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        filiais // 👈 exatamente o formato que o front espera!
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Erro interno no servidor" });
  }
});

// =====================================================
// ENDPOINT /me → Retorna usuário + filiais completas
// =====================================================
router.get("/me", async (req: any, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: "Token não enviado" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        permissoes: {
          include: {
            filial: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    return res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,

      // ✔ Agora envia do jeito correto (igual ao login)
      filiais: user.permissoes.map(p => ({
        id: p.filial.id,
        nome: p.filial.nome,
        codigo: p.filial.codigo
      }))
    });

  } catch (err) {
    return res.status(401).json({ error: "Token inválido ou expirado" });
  }
});

export default router;
