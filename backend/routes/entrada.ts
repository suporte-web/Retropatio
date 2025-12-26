import { Router } from "express";
import { prisma } from "../db";

const router = Router();

/* ======================================================
    1) REGISTRAR ENTRADA
    POST /api/entrada
====================================================== */
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    /* =========================
       NORMALIZAÇÕES
    ========================= */
    if (data.veiculoId === "") data.veiculoId = null;
    const vagaId = Number(data.vagaId);

    /* =========================
       VALIDA FILIAL
    ========================= */
    const filial = await prisma.filial.findUnique({
      where: { id: data.filialId }
    });

    if (!filial) {
      return res.status(400).json({ error: "Filial inválida" });
    }

    /* =========================
       VALIDA VAGA
    ========================= */
    const vaga = await prisma.vaga.findUnique({
      where: { id: vagaId }
    });

    if (!vaga) {
      return res.status(400).json({ error: "Vaga não encontrada" });
    }

    if (vaga.filialId !== data.filialId) {
      return res.status(400).json({ error: "Vaga não pertence à filial" });
    }

    if (vaga.status?.toLowerCase() !== "livre") {
      return res.status(400).json({ error: "Vaga ocupada" });
    }

    /* =========================
       CRIA ENTRADA
    ========================= */
    const entrada = await prisma.entrada.create({
      data: {
        filialId: data.filialId,
        vagaId: vagaId,

        placaCavalo: data.placaCavalo,
        placaCarreta: data.placaCarreta || null,
        motorista: data.motorista,
        proprietario: data.proprietario || null,
        tipo: data.tipo,

        tipoVeiculoCategoria: data.tipoVeiculoCategoria || null,
        tipoProprietario: data.tipoProprietario || null,
        cliente: data.cliente || null,
        transportadora: data.transportadora || null,
        statusCarga: data.statusCarga || null,
        doca: data.doca || null,
        valor: data.valor ? Number(data.valor) : null,
        cte: data.cte || null,
        nf: data.nf || null,
        lacre: data.lacre || null,
        cpfMotorista: data.cpfMotorista || null,
        observacoes: data.observacoes || null,
        multi: data.multi ?? false,

        status: "ativo"
      }
    });

    /* =========================
       OCUPA VAGA
    ========================= */
    await prisma.vaga.update({
      where: { id: vagaId },
      data: { status: "ocupada" }
    });

    res.json(entrada);

  } catch (error) {
    console.error("Erro ao registrar entrada:", error);
    res.status(500).json({ error: "Erro ao registrar entrada" });
  }
});

/* ======================================================
    2) REGISTRAR SAÍDA
    PATCH /api/entrada/:id/saida
====================================================== */
router.patch("/:id/saida", async (req, res) => {
  try {
    const { id } = req.params;
    const { cte, nf, lacre } = req.body;

    const entrada = await prisma.entrada.update({
      where: { id: Number(id) },
      data: {
        dataSaida: new Date(),
        status: "finalizado",
        cte: cte || null,
        nf: nf || null,
        lacre: lacre || null
      }
    });

    // 🔓 libera vaga
    await prisma.vaga.update({
      where: { id: entrada.vagaId },
      data: { status: "livre" }
    });

    res.json(entrada);
  } catch (error) {
    console.error("Erro ao registrar saída:", error);
    res.status(500).json({ error: "Erro ao registrar saída" });
  }
});

/* ======================================================
    3) LISTAR VEÍCULOS ATIVOS
====================================================== */
router.get("/ativos", async (req, res) => {
  try {
    const { filialId } = req.query;

    if (!filialId) {
      return res.status(400).json({ error: "filialId é obrigatório" });
    }

    const ativos = await prisma.entrada.findMany({
      where: {
        filialId: String(filialId),
        dataSaida: null,
        status: "ativo"
      },
      include: {
        vaga: true,
        filial: true
      },
      orderBy: { dataEntrada: "desc" }
    });

    res.json(ativos);
  } catch (error) {
    console.error("Erro ao carregar veículos ativos:", error);
    res.status(500).json({ error: "Erro ao carregar veículos ativos" });
  }
});

/* ======================================================
    4) VAGAS LIVRES POR FILIAL
====================================================== */
router.get("/vagas/livres", async (req, res) => {
  try {
    const { filialId } = req.query;

    if (!filialId) {
      return res.status(400).json({ error: "filialId é obrigatório" });
    }

    const vagas = await prisma.vaga.findMany({
      where: {
        filialId: String(filialId),
        status: "livre"
      },
      orderBy: { NomeVaga: "asc" }
    });

    res.json(vagas);
  } catch (error) {
    console.error("Erro ao buscar vagas livres:", error);
    res.status(500).json({ error: "Erro ao buscar vagas livres" });
  }
});

/* ======================================================
    5) CANCELAR ENTRADA
====================================================== */
router.patch("/:id/cancelar", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const entrada = await prisma.entrada.findUnique({
      where: { id }
    });

    if (!entrada) {
      return res.status(404).json({ error: "Entrada não encontrada" });
    }

    const cancelada = await prisma.entrada.update({
      where: { id },
      data: {
        status: "cancelado",
        dataSaida: new Date()
      }
    });

    // 🔓 libera vaga
    await prisma.vaga.update({
      where: { id: entrada.vagaId },
      data: { status: "livre" }
    });

    res.json({
      message: "Entrada cancelada com sucesso",
      entrada: cancelada
    });

  } catch (error) {
    console.error("Erro ao cancelar:", error);
    res.status(500).json({ error: "Erro ao cancelar entrada" });
  }
});

/* ======================================================
    6) REABRIR ENTRADA
====================================================== */
router.patch("/:id/reabrir", async (req, res) => {
  try {
    const id = Number(req.params.id);

    const entrada = await prisma.entrada.update({
      where: { id },
      data: {
        status: "ativo",
        dataSaida: null
      }
    });

    await prisma.vaga.update({
      where: { id: entrada.vagaId },
      data: { status: "ocupada" }
    });

    res.json({ message: "Entrada reaberta", entrada });

  } catch (error) {
    console.error("Erro ao reabrir:", error);
    res.status(500).json({ error: "Erro ao reabrir entrada" });
  }
});

export default router;
