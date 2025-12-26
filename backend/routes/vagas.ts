import { Router } from "express";
import { prisma } from "../db";

const router = Router();

/**
 * 1) Listar todas as vagas
 */
router.get("/", async (req, res) => {
  try {
    const vagas = await prisma.vaga.findMany({
      include: {
        tipoVaga: true,
        filial: true,
      },
      orderBy: { id: "asc" }  // Id é a chave primária no seu modelo
    });

    res.json(vagas);

  } catch (error) {
    console.error("Erro ao buscar vagas:", error);
    res.status(500).json({ error: "Erro interno no servidor" });
  }
});


/* ======================================================
    1) LISTAR VAGAS LIVRES POR FILIAL
====================================================== */
router.get("/livres", async (req, res) => {
  try {
    const { filialId } = req.query;

    if (!filialId) {
      return res.status(400).json({ error: "filialId é obrigatório" });
    }

    const vagas = await prisma.vaga.findMany({
      where: { filialId: String(filialId) },
      include: {
        entradas: {
          where: {
            status: "ativo",
            dataSaida: null
          },
        },
      },
      orderBy: { NomeVaga: "asc" },
    });

    const vagasLivres = vagas.filter(v => v.entradas.length === 0);

    res.json(vagasLivres);
  } catch (error) {
    console.error("Erro ao buscar vagas livres:", error);
    res.status(500).json({ error: "Erro ao buscar vagas livres" });
  }
});


/**
 * 3) Criar nova vaga
 */
router.post("/", async (req, res) => {
  try {
    const { filialId, tipoVagaId, NomeVaga, status } = req.body;

    if (!filialId || !tipoVagaId || !NomeVaga) {
      return res.status(400).json({
        error: "Campos obrigatórios faltando (filialId, tipoVagaId, NomeVaga)",
      });
    }

    // 🔎 valida FILIAL
    const filial = await prisma.filial.findUnique({
      where: { id: filialId },
    });

    if (!filial) {
      return res.status(400).json({
        error: "Filial inválida",
      });
    }

    // 🔎 valida TIPO DE VAGA
    const tipoVaga = await prisma.tipoVaga.findUnique({
      where: { Id: Number(tipoVagaId) },
    });

    if (!tipoVaga) {
      return res.status(400).json({
        error: "Tipo de vaga inválido",
      });
    }

    const novaVaga = await prisma.vaga.create({
      data: {
        filialId,
        tipoVagaId: Number(tipoVagaId),
        NomeVaga,
        status: status || "livre",
      },
    });

    return res.status(201).json({
      message: "Vaga criada com sucesso",
      vaga: novaVaga,
    });
  } catch (error: any) {
    console.error("Erro ao criar vaga:", error);
    return res.status(500).json({
      error: error.message,
      meta: error.meta,
    });
  }
});


/**
 * 4) Excluir vaga
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { filialId } = req.body;

    if (!filialId) {
      return res.status(400).json({
        error: "filialId é obrigatório para excluir vaga",
      });
    }

    const vaga = await prisma.vaga.findUnique({
      where: { id: Number(id) },
    });

    if (!vaga) {
      return res.status(404).json({
        error: "Vaga não encontrada",
      });
    }

    if (vaga.filialId !== filialId) {
      return res.status(403).json({
        error: "Vaga não pertence à filial selecionada",
      });
    }

    await prisma.vaga.delete({
      where: { id: Number(id) },
    });

    return res.json({ message: "Vaga excluída com sucesso!" });

  } catch (error: any) {
    console.error("Erro ao excluir vaga:", error);

    return res.status(500).json({
      error: error.message,
      meta: error.meta,
    });
  }
});


/* ======================================================
    2) LISTAR VAGAS OCUPADAS POR FILIAL
    GET /api/vagas/ocupadas?filialId=xxxx
====================================================== */

router.get("/ocupadas", async (req, res) => {
  try {
    const { filialId } = req.query;

    if (!filialId) {
      return res.status(400).json({ error: "filialId é obrigatório" });
    }

    // Busca vagas com entrada ativa
    const vagas = await prisma.vaga.findMany({
      where: {
        filialId: String(filialId),
        entradas: {
          some: {
            status: "ativo",
            dataSaida: null
          }
        }
      },
      include: {
        entradas: {
          where: {
            status: "ativo",
            dataSaida: null
          }
        }
      },
      orderBy: { NomeVaga: "asc" },
    });

    res.json(vagas);
  } catch (error) {
    console.error("Erro ao buscar vagas ocupadas:", error);
    res.status(500).json({ error: "Erro ao buscar vagas ocupadas" });
  }
});



/* ======================================================
    LISTAR VAGAS POR FILIAL (MVP)
    GET /api/vagas/filial/:filialId
====================================================== */
router.get("/filial/:filialId", async (req, res) => {
  try {
    const { filialId } = req.params;

    const vagas = await prisma.vaga.findMany({
      where: {
        filialId: String(filialId),
      },
      include: {
        tipoVaga: true,
        filial: true,
      },
      orderBy: { NomeVaga: "asc" },
    });

    return res.json(vagas);
  } catch (error) {
    console.error("Erro ao listar vagas da filial:", error);
    return res.status(500).json({ error: "Erro ao listar vagas" });
  }
});


/* ======================================================
    3) STATUS DE UMA VAGA
    GET /api/vagas/:id/status
====================================================== */

router.get("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;

    const vaga = await prisma.vaga.findUnique({
      where: { id: Number(id) },
      include: {
        entradas: {
          where: {
            status: "ativo",
            dataSaida: null
          }
        }
      }
    });

    if (!vaga) {
      return res.status(404).json({ error: "Vaga não encontrada" });
    }

    const status = vaga.entradas.length > 0 ? "ocupada" : "livre";

    res.json({
      vagaId: vaga.id,
      NomeVaga: vaga.NomeVaga,
      status,
    });
  } catch (error) {
    console.error("Erro ao buscar status da vaga:", error);
    res.status(500).json({ error: "Erro ao buscar status da vaga" });
  }
});

/**
 * GET /api/vagas/tipos?filialId=xxxx
 * Lista vagas organizadas por tipo
 */
router.get("/tipos", async (req, res) => {
  try {
    const { filialId } = req.query;

    if (!filialId) {
      return res.status(400).json({ error: "filialId é obrigatório" });
    }

    const tipos = await prisma.tipoVaga.findMany({
      include: {
        Vagas: {
          where: { filialId: String(filialId) },
          orderBy: { NomeVaga: "asc" }
        }
      }
    });

    const resposta: any = {};
    tipos.forEach((tipo) => {
      resposta[tipo.Nome] = tipo.Vagas;
    });

    res.json(resposta);
  } catch (error) {
    console.error("Erro ao listar vagas por tipo:", error);
    res.status(500).json({ error: "Erro ao listar vagas por tipo" });
  }
});

/**
 * Atualizar vaga
 * PUT /api/vagas/:id
 */
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { NomeVaga, filialId, tipoVagaId, status } = req.body;

    // Verifica se a vaga existe
    const vaga = await prisma.vaga.findUnique({
      where: { id: Number(id) },
    });

    if (!vaga) {
      return res.status(404).json({ error: "Vaga não encontrada" });
    }

    // Valida filial
    if (filialId) {
      const filialExists = await prisma.filial.findUnique({
        where: { id: filialId },
      });

      if (!filialExists) {
        return res.status(400).json({ error: "Filial inválida" });
      }
    }

    // Valida tipo de vaga
    if (tipoVagaId) {
      const tipoExists = await prisma.tipoVaga.findUnique({
        where: { Id: Number(tipoVagaId) },
      });

      if (!tipoExists) {
        return res.status(400).json({ error: "Tipo de vaga inválido" });
      }
    }

    // Atualiza a vaga
    const updated = await prisma.vaga.update({
      where: { id: Number(id) },
      data: {
        NomeVaga: NomeVaga ?? vaga.NomeVaga,
        filialId: filialId ?? vaga.filialId,
        tipoVagaId: tipoVagaId ?? vaga.tipoVagaId,
        status: status ?? vaga.status,
      },
    });

    res.json({
      message: "Vaga atualizada com sucesso",
      vaga: updated,
    });

  } catch (error) {
    console.error("Erro ao atualizar vaga:", error);
    res.status(500).json({ error: "Erro interno ao atualizar vaga" });
  }
});


import multer from "multer";
import * as XLSX from "xlsx";

const upload = multer({ storage: multer.memoryStorage() });

router.post("/import", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Arquivo não enviado" });
    }

    // Lê o Excel
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(sheet);

    let criadas = 0;
    const erros: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        const { NomeVaga, Filial, TipoVaga, Status } = row;

        if (!NomeVaga || !Filial || !TipoVaga) {
          throw new Error("Campos obrigatórios faltando");
        }

        const filial = await prisma.filial.findFirst({
          where: { nome: String(Filial) },
        });

        if (!filial) throw new Error("Filial não encontrada");

        const tipo = await prisma.tipoVaga.findFirst({
          where: { Nome: String(TipoVaga) },
        });

        if (!tipo) throw new Error("Tipo de vaga não encontrado");

        await prisma.vaga.create({
          data: {
            NomeVaga: String(NomeVaga),
            filialId: filial.id,
            tipoVagaId: tipo.Id,
            status: Status || "livre",
          },
        });

        criadas++;
      } catch (err: any) {
        erros.push({
          linha: i + 2, // linha real do Excel
          erro: err.message,
        });
      }
    }

    return res.json({
      message: "Importação finalizada",
      criadas,
      erros,
    });
  } catch (error) {
    console.error("Erro ao importar vagas:", error);
    return res.status(500).json({ error: "Erro ao importar vagas" });
  }
});



export default router;
