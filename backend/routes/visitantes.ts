import { Router } from "express";
import { prisma } from "../db";

const router = Router();

/* ======================================================
   CRIAR VISITANTE
   POST /api/visitantes
====================================================== */
router.post("/", async (req, res) => {
  try {
    const {
      nome,
      cpf,
      empresa,
      tipoVisita,
      motivoVisita,
      filialId,
    } = req.body;

    if (!nome || !cpf || !tipoVisita || !filialId) {
      return res.status(400).json({ error: "Dados obrigatórios ausentes" });
    }

    const visitante = await prisma.visitante.create({
      data: {
        nome,
        cpf,
        empresa,
        tipoVisita,
        motivoVisita,
        filialId,
        status: "aguardando",
      },
    });

    res.json(visitante);
  } catch (error) {
    console.error("Erro ao criar visitante:", error);
    res.status(500).json({ error: "Erro ao criar visitante" });
  }
});

/* ======================================================
   LISTAR VISITANTES POR FILIAL (CONTRATO DO FRONT)
   GET /api/visitantes?filialId=xxxx
====================================================== */
router.get("/", async (req, res) => {
  try {
    const { filialId } = req.query;

    if (!filialId) {
      return res.status(400).json({ error: "filialId é obrigatório" });
    }

    const visitantes = await prisma.visitante.findMany({
      where: { filialId: String(filialId) },
      orderBy: { id: "desc" },
    });

    res.json(visitantes);
  } catch (error) {
    console.error("Erro ao listar visitantes:", error);
    res.status(500).json({ error: "Erro ao buscar visitantes" });
  }
});

/* ======================================================
   COMPATIBILIDADE COM FRONT ANTIGO
   GET /api/visitantes/filial/:filialId
====================================================== */
router.get("/filial/:filialId", async (req, res) => {
  try {
    const { filialId } = req.params;

    const visitantes = await prisma.visitante.findMany({
      where: { filialId },
      orderBy: { id: "desc" },
    });

    return res.json(visitantes);
  } catch (error) {
    console.error("Erro ao listar visitantes por filial:", error);
    return res.status(500).json({ error: "Erro ao buscar visitantes" });
  }
});


/* ======================================================
   PAINEL DE VISITANTES
   GET /api/visitantes/painel/:filialId
====================================================== */
router.get("/painel/:filialId", async (req, res) => {
  try {
    const { filialId } = req.params;

    const visitantes = await prisma.visitante.findMany({
      where: {
        filialId,
        status: { in: ["aguardando", "aprovado", "dentro"] },
      },
      orderBy: { id: "desc" },
    });

    res.json(visitantes);
  } catch (error) {
    console.error("Erro ao carregar painel:", error);
    res.status(500).json({ error: "Erro ao carregar painel" });
  }
});

/* ======================================================
   HISTÓRICO DE VISITANTES
   GET /api/visitantes/historico/:filialId
====================================================== */
router.get("/historico/:filialId", async (req, res) => {
  try {
    const { filialId } = req.params;

    const historico = await prisma.visitante.findMany({
      where: {
        filialId,
        OR: [{ status: "saiu" }, { dataSaida: { not: null } }],
      },
      orderBy: { dataSaida: "desc" },
    });

    res.json(historico);
  } catch (error) {
    console.error("Erro ao buscar histórico:", error);
    res.status(500).json({ error: "Erro ao buscar histórico" });
  }
});

/* ======================================================
   AGUARDANDO APROVAÇÃO
   GET /api/visitantes/aguardando/:filialId
====================================================== */
router.get("/aguardando/:filialId", async (req, res) => {
  try {
    const { filialId } = req.params;

    const aguardando = await prisma.visitante.findMany({
      where: { filialId, status: "aguardando" },
      orderBy: { id: "desc" },
    });

    res.json(aguardando);
  } catch (error) {
    console.error("Erro ao listar aguardando:", error);
    res.status(500).json({ error: "Erro ao buscar aguardando" });
  }
});

/* ======================================================
   VISITANTES DENTRO
   GET /api/visitantes/dentro/:filialId
====================================================== */
router.get("/dentro/:filialId", async (req, res) => {
  try {
    const { filialId } = req.params;

    const dentro = await prisma.visitante.findMany({
      where: { filialId, status: "dentro" },
      orderBy: { dataEntrada: "desc" },
    });

    res.json(dentro);
  } catch (error) {
    console.error("Erro ao listar dentro:", error);
    res.status(500).json({ error: "Erro ao buscar visitantes dentro" });
  }
});

/* ======================================================
   APROVAR VISITANTE
   PATCH /api/visitantes/:id/aprovar
====================================================== */
router.patch("/:id/aprovar", async (req, res) => {
  try {
    const { id } = req.params;

    const visitante = await prisma.visitante.update({
      where: { id: Number(id) },
      data: { status: "aprovado" },
    });

    res.json(visitante);
  } catch (error) {
    console.error("Erro ao aprovar visitante:", error);
    res.status(500).json({ error: "Erro ao aprovar visitante" });
  }
});

/* ======================================================
   REGISTRAR ENTRADA
   PATCH /api/visitantes/:id/entrada
====================================================== */
router.patch("/:id/entrada", async (req, res) => {
  try {
    const { id } = req.params;

    const visitante = await prisma.visitante.update({
      where: { id: Number(id) },
      data: {
        status: "dentro",
        dataEntrada: new Date(),
      },
    });

    res.json(visitante);
  } catch (error) {
    console.error("Erro ao registrar entrada:", error);
    res.status(500).json({ error: "Erro ao registrar entrada" });
  }
});

/* ======================================================
   REGISTRAR SAÍDA
   PATCH /api/visitantes/:id/saida
====================================================== */
router.patch("/:id/saida", async (req, res) => {
  try {
    const { id } = req.params;

    const visitante = await prisma.visitante.update({
      where: { id: Number(id) },
      data: {
        status: "saiu",
        dataSaida: new Date(),
      },
    });

    res.json(visitante);
  } catch (error) {
    console.error("Erro ao registrar saída:", error);
    res.status(500).json({ error: "Erro ao registrar saída" });
  }
});

export default router;
