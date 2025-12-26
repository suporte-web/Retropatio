import { Router } from "express";
import { prisma } from "../db";

const router = Router();

/* ======================================================
   AUDIT LOGS
   GET /api/audit-logs
====================================================== */
router.get("/", async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
    });

    return res.json(logs);
  } catch (error) {
    console.error("Erro ao buscar audit logs:", error);
    return res.status(500).json({ error: "Erro ao buscar audit logs" });
  }
});

export default router;
