// Reference: blueprint:javascript_websocket
import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import {
  hashPassword,
  comparePasswords,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  sanitizeUser,
  requireAuth,
  requireRole,
} from "./auth";
import {
  loginSchema,
  registerSchema,
  refreshTokenRequestSchema,
  insertUserSchema,
  insertFilialSchema,
  insertVeiculoSchema,
  insertVagaSchema,
  insertVisitanteSchema,
  insertChamadaSchema,
  insertMotoristaSchema,
  insertVeiculoCadastroSchema,
  insertFornecedorSchema,
  insertStatusCaminhaoSchema,
  type User,
} from "@shared/schema";
import { fromZodError } from "zod-validation-error";

// Middleware to validate Zod schema
function validateBody(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const validationError = fromZodError(result.error);
      return res.status(400).json({ error: validationError.message });
    }
    req.body = result.data;
    next();
  };
}

// Middleware to enforce X-Filial header for multi-tenant isolation
async function requireFilial(req: Request, res: Response, next: NextFunction) {
  const filialId = req.headers["x-filial"] as string;
  const user = (req as any).user as User | undefined;
  
  if (!filialId) {
    return res.status(400).json({ error: "Header X-Filial é obrigatório" });
  }
  
  // Validate that the user has access to this filial
  if (user) {
    const userFiliais = await storage.getUserFilialIds(user.id);
    if (!userFiliais.includes(filialId)) {
      return res.status(403).json({ error: "Acesso negado a esta filial" });
    }
  }
  
  (req as any).filialId = filialId;
  next();
}

// Middleware to log audit
async function logAudit(req: Request, acao: string, entidade: string, entidadeId?: string, dadosAntes?: any, dadosDepois?: any) {
  const user = (req as any).user as User | undefined;
  if (!user) return;
  
  const filialId = (req as any).filialId as string | undefined;
  
  await storage.createAuditLog({
    userId: user.id,
    filialId: filialId || null,
    acao,
    entidade,
    entidadeId: entidadeId || null,
    dadosAntes: dadosAntes ? JSON.stringify(dadosAntes) : null,
    dadosDepois: dadosDepois ? JSON.stringify(dadosDepois) : null,
    ipAddress: req.ip || req.socket.remoteAddress || null,
    userAgent: req.headers["user-agent"] || null,
  });
}

export function registerRoutes(app: Express): Server {
  // Clean up expired tokens periodically (every hour)
  setInterval(async () => {
    try {
      await storage.deleteExpiredTokens();
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
    }
  }, 60 * 60 * 1000);

  // ==================== Authentication Routes ====================
  
  // DISABLED: Public registration disabled. Only admins can create users via /api/users
  // app.post("/api/register", validateBody(registerSchema), async (req, res, next) => {
  //   try {
  //     const existingUser = await storage.getUserByUsername(req.body.username);
  //     if (existingUser) {
  //       return res.status(400).json({ error: "Nome de usuário já existe" });
  //     }

  //     const existingEmail = await storage.getUserByEmail(req.body.email);
  //     if (existingEmail) {
  //       return res.status(400).json({ error: "E-mail já cadastrado" });
  //     }

  //     const user = await storage.createUser({
  //       ...req.body,
  //       role: "cliente", // Default role, admin can change later
  //       password: await hashPassword(req.body.password),
  //     });

  //     const accessToken = generateAccessToken(user);
  //     const refreshToken = generateRefreshToken(user);

  //     // Store refresh token
  //     const expiresAt = new Date();
  //     expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  //     await storage.createRefreshToken({
  //       userId: user.id,
  //       token: refreshToken,
  //       expiresAt,
  //     });

  //     await logAudit(req, "REGISTRO", "users", user.id, null, user);

  //     res.status(201).json({
  //       user: sanitizeUser(user),
  //       accessToken,
  //       refreshToken,
  //     });
  //   } catch (error) {
  //     next(error);
  //   }
  // });

  app.post("/api/login", validateBody(loginSchema), async (req, res, next) => {
    try {
      const user = await storage.getUserByUsername(req.body.username);
      
      if (!user) {
        return res.status(401).json({ error: "Usuário não encontrado" });
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(401).json({ error: "Conta bloqueada. Tente novamente mais tarde." });
      }

      const passwordMatch = await comparePasswords(req.body.password, user.password);
      
      if (!passwordMatch) {
        await storage.incrementLoginAttempts(user.id);
        return res.status(401).json({ error: "Senha incorreta" });
      }

      if (!user.ativo) {
        return res.status(401).json({ error: "Usuário inativo" });
      }

      // Reset login attempts on successful login
      await storage.resetLoginAttempts(user.id);

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Store refresh token
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
      await storage.createRefreshToken({
        userId: user.id,
        token: refreshToken,
        expiresAt,
      });

      (req as any).user = user;
      await logAudit(req, "LOGIN", "users", user.id);

      res.json({
        user: sanitizeUser(user),
        accessToken,
        refreshToken,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/refresh", validateBody(refreshTokenRequestSchema), async (req, res, next) => {
    try {
      const { refreshToken } = req.body;
      
      const storedToken = await storage.getRefreshToken(refreshToken);
      
      if (!storedToken) {
        return res.status(401).json({ error: "Refresh token inválido" });
      }

      if (storedToken.expiresAt < new Date()) {
        await storage.deleteRefreshToken(refreshToken);
        return res.status(401).json({ error: "Refresh token expirado" });
      }

      const user = await storage.getUser(storedToken.userId);
      
      if (!user || !user.ativo) {
        return res.status(401).json({ error: "Usuário inválido ou inativo" });
      }

      const newAccessToken = generateAccessToken(user);

      res.json({
        accessToken: newAccessToken,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/logout", requireAuth, async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const refreshToken = req.body.refreshToken;
        if (refreshToken) {
          await storage.deleteRefreshToken(refreshToken);
        }
      }
      
      const user = (req as any).user;
      await logAudit(req, "LOGOUT", "users", user?.id);
      
      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/user", requireAuth, (req, res) => {
    const user = (req as any).user as User;
    res.json(sanitizeUser(user));
  });

  // ==================== Users Routes ====================
  
  app.get("/api/users", requireAuth, requireRole("gestor"), async (req, res, next) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users.map(sanitizeUser));
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/users", requireAuth, requireRole("gestor"), validateBody(insertUserSchema), async (req, res, next) => {
    try {
      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });
      
      await logAudit(req, "CRIAR_USUARIO", "users", user.id, null, user);
      res.status(201).json(sanitizeUser(user));
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/users/:id", requireAuth, requireRole("gestor"), async (req, res, next) => {
    try {
      const userBefore = await storage.getUser(req.params.id);
      
      // If updating password, hash it
      const updateData = { ...req.body };
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }
      
      const user = await storage.updateUser(req.params.id, updateData);
      
      await logAudit(req, "ATUALIZAR_USUARIO", "users", user.id, userBefore, user);
      res.json(sanitizeUser(user));
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/user-filiais", requireAuth, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialIds = await storage.getUserFilialIds(user.id);
      res.json(filialIds);
    } catch (error) {
      next(error);
    }
  });

  // ==================== User Permissions Routes ====================
  
  // Get all permissions for a user (with filial details)
  app.get("/api/users/:userId/permissions", requireAuth, requireRole("gestor"), async (req, res, next) => {
    try {
      const currentUser = (req as any).user as User;
      const currentUserFilials = await storage.getUserFilialIds(currentUser.id);
      
      // Get all permissions but only return those for filials the current user has access to
      const allPermissions = await storage.getUserPermissions(req.params.userId);
      const filteredPermissions = allPermissions.filter(p => currentUserFilials.includes(p.filialId));
      
      res.json(filteredPermissions);
    } catch (error) {
      next(error);
    }
  });

  // Add permission for a user
  app.post("/api/users/:userId/permissions", requireAuth, requireRole("gestor"), async (req, res, next) => {
    try {
      const currentUser = (req as any).user as User;
      const { filialId } = req.body;
      
      if (!filialId) {
        return res.status(400).json({ error: "filialId é obrigatório" });
      }

      // Verify that the current gestor has access to the filial they're trying to assign
      const currentUserFilials = await storage.getUserFilialIds(currentUser.id);
      if (!currentUserFilials.includes(filialId)) {
        return res.status(403).json({ error: "Você não tem permissão para atribuir acesso a esta filial" });
      }

      const permission = await storage.createUserPermission({
        userId: req.params.userId,
        filialId,
      });
      
      await logAudit(req, "ADICIONAR_PERMISSAO_USUARIO", "user_permissions", permission.id, null, permission);
      res.status(201).json(permission);
    } catch (error) {
      next(error);
    }
  });

  // Delete a user permission
  app.delete("/api/user-permissions/:id", requireAuth, requireRole("gestor"), async (req, res, next) => {
    try {
      const currentUser = (req as any).user as User;
      
      // Get the permission to verify the gestor has access to that filial
      const permission = await storage.getUserPermission(req.params.id);
      
      if (!permission) {
        return res.status(404).json({ error: "Permissão não encontrada" });
      }
      
      // Verify that the current gestor has access to the filial
      const currentUserFilials = await storage.getUserFilialIds(currentUser.id);
      if (!currentUserFilials.includes(permission.filialId)) {
        return res.status(403).json({ error: "Você não tem permissão para remover acesso a esta filial" });
      }

      await storage.deleteUserPermission(req.params.id);
      await logAudit(req, "REMOVER_PERMISSAO_USUARIO", "user_permissions", req.params.id, null, null);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // ==================== Filiais Routes ====================
  
  app.get("/api/filiais", requireAuth, async (req, res, next) => {
    try {
      const filiais = await storage.getAllFiliais();
      res.json(filiais);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/filiais", requireAuth, requireRole("gestor"), validateBody(insertFilialSchema), async (req, res, next) => {
    try {
      const filial = await storage.createFilial(req.body);
      
      await logAudit(req, "CRIAR_FILIAL", "filiais", filial.id, null, filial);
      res.status(201).json(filial);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/filiais/:id", requireAuth, requireRole("gestor"), async (req, res, next) => {
    try {
      const filialBefore = await storage.getFilial(req.params.id);
      const filial = await storage.updateFilial(req.params.id, req.body);
      
      await logAudit(req, "ATUALIZAR_FILIAL", "filiais", filial.id, filialBefore, filial);
      res.json(filial);
    } catch (error) {
      next(error);
    }
  });

  // ==================== Veiculos Routes ====================
  
  app.get("/api/veiculos/all", requireAuth, requireRole("gestor"), requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const veiculos = await storage.getVeiculosByFilial(filialId);
      res.json(veiculos);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/veiculos", requireAuth, requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const veiculos = await storage.getVeiculosByFilial(filialId);
      res.json(veiculos);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/veiculos", requireAuth, requireFilial, validateBody(insertVeiculoSchema), async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      
      const veiculo = await storage.createVeiculo({
        ...req.body,
        filialId,
        registradoPor: user.id,
      });
      
      await logAudit(req, "REGISTRAR_ENTRADA_VEICULO", "veiculos", veiculo.id, null, veiculo);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "veiculo_entrada", data: veiculo }, veiculo.filialId);
      
      res.status(201).json(veiculo);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/veiculos/:id/saida", requireAuth, requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const veiculoBefore = await storage.getVeiculo(req.params.id);
      
      if (!veiculoBefore) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }
      
      if (veiculoBefore.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este veículo" });
      }
      
      // Aceita dados opcionais de CTE, NF, LACRE do req.body
      const { cte, nf, lacre } = req.body;
      const veiculo = await storage.registrarSaida(req.params.id, { cte, nf, lacre });
      
      await logAudit(req, "REGISTRAR_SAIDA_VEICULO", "veiculos", veiculo.id, veiculoBefore, veiculo);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "veiculo_saida", data: veiculo }, veiculo.filialId);
      
      res.json(veiculo);
    } catch (error) {
      next(error);
    }
  });

  // ==================== Vagas Routes ====================
  
  app.get("/api/vagas/all", requireAuth, requireRole("gestor"), async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const userFilialIds = await storage.getUserFilialIds(user.id);
      
      // Get all vagas but only return those from filiais the gestor has access to
      const allVagas = await storage.getAllVagas();
      const filteredVagas = allVagas.filter(vaga => userFilialIds.includes(vaga.filialId));
      
      res.json(filteredVagas);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/vagas", requireAuth, requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const vagas = await storage.getVagasByFilial(filialId);
      res.json(vagas);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/vagas", requireAuth, requireRole("gestor"), requireFilial, validateBody(insertVagaSchema), async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      
      const vaga = await storage.createVaga({
        ...req.body,
        filialId,
      });
      
      await logAudit(req, "CRIAR_VAGA", "vagas", vaga.id, null, vaga);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "vaga_created", data: vaga }, vaga.filialId);
      
      res.status(201).json(vaga);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/vagas/:id", requireAuth, requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const vagaBefore = await storage.getVaga(req.params.id);
      
      if (!vagaBefore) {
        return res.status(404).json({ error: "Vaga não encontrada" });
      }
      
      if (vagaBefore.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a esta vaga" });
      }
      
      // Prevent filialId from being changed via PATCH
      const { filialId: _, ...updateData } = req.body;
      const vaga = await storage.updateVaga(req.params.id, updateData);
      
      await logAudit(req, "ATUALIZAR_VAGA", "vagas", vaga.id, vagaBefore, vaga);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "vaga_updated", data: vaga }, vaga.filialId);
      
      res.json(vaga);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/vagas/:id", requireAuth, requireRole("gestor"), requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const vaga = await storage.getVaga(req.params.id);
      
      if (!vaga) {
        return res.status(404).json({ error: "Vaga não encontrada" });
      }
      
      if (vaga.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a esta vaga" });
      }

      // Check if vaga is occupied
      if (vaga.status === "ocupada") {
        return res.status(400).json({ error: "Não é possível deletar uma vaga ocupada" });
      }

      await storage.deleteVaga(req.params.id);
      
      await logAudit(req, "DELETAR_VAGA", "vagas", vaga.id, vaga, null);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "vaga_deleted", data: { id: vaga.id } }, vaga.filialId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // ==================== Visitantes Routes ====================
  
  app.get("/api/visitantes", requireAuth, requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const visitantes = await storage.getVisitantesByFilial(filialId);
      res.json(visitantes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/visitantes", requireAuth, requireFilial, validateBody(insertVisitanteSchema), async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      
      const visitante = await storage.createVisitante({
        ...req.body,
        filialId,
      });
      
      await logAudit(req, "CRIAR_VISITANTE", "visitantes", visitante.id, null, visitante);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "visitante_novo", data: visitante }, visitante.filialId);
      
      // Create notification for gestores of this filial if visitor is awaiting approval
      if (visitante.status === "aguardando") {
        // Get all users and filter for active gestores
        const allUsers = await storage.getAllUsers();
        const gestores = allUsers.filter(u => u.role === "gestor" && u.ativo);
        
        // Create notification only for gestores with permission in this filial
        for (const gestor of gestores) {
          const gestorFilialIds = await storage.getUserFilialIds(gestor.id);
          
          // Only notify if gestor has access to this filial
          if (gestorFilialIds.includes(filialId)) {
            await storage.createNotification({
              userId: gestor.id,
              filialId: filialId,
              tipo: "visitante_aprovacao",
              titulo: "Novo visitante aguardando aprovação",
              mensagem: `${visitante.nome} (${visitante.tipoVisita}) aguarda aprovação para entrada.`,
              status: "nao_lida",
              entidadeId: visitante.id,
              entidadeTipo: "visitante",
              actionUrl: `/visitantes`,
            });
            // Note: Notification not broadcasted via WebSocket for security.
            // Frontend will poll /api/notifications/unread-count periodically.
          }
        }
      }
      
      res.status(201).json(visitante);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/visitantes/:id/aprovar", requireAuth, requireRole("porteiro", "gestor"), requireFilial, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      const visitanteBefore = await storage.getVisitante(req.params.id);
      
      if (!visitanteBefore) {
        return res.status(404).json({ error: "Visitante não encontrado" });
      }
      
      if (visitanteBefore.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este visitante" });
      }
      
      const visitante = await storage.updateVisitante(req.params.id, {
        status: "aprovado",
        aprovadoPor: user.id,
        dataAprovacao: new Date(),
      });
      
      await logAudit(req, "APROVAR_VISITANTE", "visitantes", visitante.id, visitanteBefore, visitante);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "visitante_aprovado", data: visitante }, visitante.filialId);
      
      res.json(visitante);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/visitantes/:id/entrada", requireAuth, requireRole("porteiro", "gestor"), requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const visitanteBefore = await storage.getVisitante(req.params.id);
      
      if (!visitanteBefore) {
        return res.status(404).json({ error: "Visitante não encontrado" });
      }
      
      if (visitanteBefore.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este visitante" });
      }
      
      const visitante = await storage.updateVisitante(req.params.id, {
        status: "dentro",
        dataEntrada: new Date(),
      });
      
      await logAudit(req, "REGISTRAR_ENTRADA_VISITANTE", "visitantes", visitante.id, visitanteBefore, visitante);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "visitante_entrada", data: visitante }, visitante.filialId);
      
      res.json(visitante);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/visitantes/:id/saida", requireAuth, requireRole("porteiro", "gestor"), requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const visitanteBefore = await storage.getVisitante(req.params.id);
      
      if (!visitanteBefore) {
        return res.status(404).json({ error: "Visitante não encontrado" });
      }
      
      if (visitanteBefore.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este visitante" });
      }
      
      const visitante = await storage.updateVisitante(req.params.id, {
        status: "saiu",
        dataSaida: new Date(),
      });
      
      await logAudit(req, "REGISTRAR_SAIDA_VISITANTE", "visitantes", visitante.id, visitanteBefore, visitante);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "visitante_saida", data: visitante }, visitante.filialId);
      
      res.json(visitante);
    } catch (error) {
      next(error);
    }
  });

  // ==================== Chamadas Routes ====================
  
  app.get("/api/chamadas", requireAuth, requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const chamadas = await storage.getChamadasByFilial(filialId);
      res.json(chamadas);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/chamadas", requireAuth, requireFilial, validateBody(insertChamadaSchema), async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      
      const chamada = await storage.createChamada({
        ...req.body,
        filialId,
        criadoPor: user.id,
      });
      
      await logAudit(req, "CRIAR_CHAMADA", "chamadas", chamada.id, null, chamada);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "chamada_nova", data: chamada }, chamada.filialId);
      
      res.status(201).json(chamada);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/chamadas/:id/atender", requireAuth, requireRole("porteiro", "gestor"), requireFilial, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      const chamadaBefore = await storage.getChamada(req.params.id);
      
      if (!chamadaBefore) {
        return res.status(404).json({ error: "Chamada não encontrada" });
      }
      
      if (chamadaBefore.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a esta chamada" });
      }
      
      const chamada = await storage.updateChamada(req.params.id, {
        status: "atendida",
        atendidoPor: user.id,
        dataAtendimento: new Date(),
      });
      
      await logAudit(req, "ATENDER_CHAMADA", "chamadas", chamada.id, chamadaBefore, chamada);
      
      // Broadcast to WebSocket clients (only to this filial)
      broadcastToClients({ type: "chamada_atendida", data: chamada }, chamada.filialId);
      
      res.json(chamada);
    } catch (error) {
      next(error);
    }
  });

  // ==================== Notifications Routes ====================
  
  // Get all notifications for current user
  app.get("/api/notifications", requireAuth, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const notifications = await storage.getNotificationsByUser(user.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  // Get unread notifications count
  app.get("/api/notifications/unread-count", requireAuth, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const count = await storage.getUnreadCountByUser(user.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const { id } = req.params;
      
      // Verify ownership
      const notification = await storage.getNotification(id);
      if (!notification) {
        return res.status(404).json({ error: "Notificação não encontrada" });
      }
      if (notification.userId !== user.id) {
        return res.status(403).json({ error: "Você não tem permissão para acessar esta notificação" });
      }
      
      const updated = await storage.markAsRead(id);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", requireAuth, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      await storage.markAllAsRead(user.id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", requireAuth, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const { id } = req.params;
      
      // Verify ownership
      const notification = await storage.getNotification(id);
      if (!notification) {
        return res.status(404).json({ error: "Notificação não encontrada" });
      }
      if (notification.userId !== user.id) {
        return res.status(403).json({ error: "Você não tem permissão para deletar esta notificação" });
      }
      
      await storage.deleteNotification(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ==================== Motoristas Routes ====================
  
  app.get("/api/motoristas", requireAuth, requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const motoristas = await storage.getMotoristasByFilial(filialId);
      res.json(motoristas);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/motoristas", requireAuth, requireRole("gestor"), requireFilial, validateBody(insertMotoristaSchema), async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      
      const motorista = await storage.createMotorista({
        ...req.body,
        filialId,
      });

      await storage.createAuditLog({
        acao: "create",
        entidade: "motorista",
        entidadeId: motorista.id,
        userId: user.id,
        filialId,
        dadosDepois: JSON.stringify(motorista),
      });

      res.status(201).json(motorista);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/motoristas/:id", requireAuth, requireRole("gestor"), requireFilial, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      const before = await storage.getMotorista(req.params.id);
      
      if (!before) {
        return res.status(404).json({ error: "Motorista não encontrado" });
      }
      
      if (before.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este motorista" });
      }
      
      // Prevent filialId from being changed via PATCH
      const { filialId: _, ...updateData } = req.body;
      const motorista = await storage.updateMotorista(req.params.id, updateData);

      await storage.createAuditLog({
        acao: "update",
        entidade: "motorista",
        entidadeId: motorista.id,
        userId: user.id,
        filialId: motorista.filialId,
        dadosAntes: JSON.stringify(before),
        dadosDepois: JSON.stringify(motorista),
      });

      res.json(motorista);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/motoristas/:id", requireAuth, requireRole("gestor"), requireFilial, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      const motorista = await storage.getMotorista(req.params.id);
      
      if (!motorista) {
        return res.status(404).json({ error: "Motorista não encontrado" });
      }
      
      if (motorista.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este motorista" });
      }

      await storage.deleteMotorista(req.params.id);

      await storage.createAuditLog({
        acao: "delete",
        entidade: "motorista",
        entidadeId: req.params.id,
        userId: user.id,
        filialId: motorista.filialId,
        dadosAntes: JSON.stringify(motorista),
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ==================== Veículos Cadastro Routes ====================
  
  app.get("/api/veiculos-cadastro", requireAuth, requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const veiculos = await storage.getVeiculosCadastroByFilial(filialId);
      res.json(veiculos);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/veiculos-cadastro", requireAuth, requireRole("gestor"), requireFilial, validateBody(insertVeiculoCadastroSchema), async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      
      const veiculo = await storage.createVeiculoCadastro({
        ...req.body,
        filialId,
      });

      await storage.createAuditLog({
        acao: "create",
        entidade: "veiculo_cadastro",
        entidadeId: veiculo.id,
        userId: user.id,
        filialId,
        dadosDepois: JSON.stringify(veiculo),
      });

      res.status(201).json(veiculo);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/veiculos-cadastro/:id", requireAuth, requireRole("gestor"), requireFilial, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      const before = await storage.getVeiculoCadastro(req.params.id);
      
      if (!before) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }
      
      if (before.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este veículo" });
      }
      
      // Prevent filialId from being changed via PATCH
      const { filialId: _, ...updateData } = req.body;
      const veiculo = await storage.updateVeiculoCadastro(req.params.id, updateData);

      await storage.createAuditLog({
        acao: "update",
        entidade: "veiculo_cadastro",
        entidadeId: veiculo.id,
        userId: user.id,
        filialId: veiculo.filialId,
        dadosAntes: JSON.stringify(before),
        dadosDepois: JSON.stringify(veiculo),
      });

      res.json(veiculo);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/veiculos-cadastro/:id", requireAuth, requireRole("gestor"), requireFilial, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      const veiculo = await storage.getVeiculoCadastro(req.params.id);
      
      if (!veiculo) {
        return res.status(404).json({ error: "Veículo não encontrado" });
      }
      
      if (veiculo.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este veículo" });
      }

      await storage.deleteVeiculoCadastro(req.params.id);

      await storage.createAuditLog({
        acao: "delete",
        entidade: "veiculo_cadastro",
        entidadeId: req.params.id,
        userId: user.id,
        filialId: veiculo.filialId,
        dadosAntes: JSON.stringify(veiculo),
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ==================== Fornecedores Routes ====================
  
  app.get("/api/fornecedores", requireAuth, requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const fornecedores = await storage.getFornecedoresByFilial(filialId);
      res.json(fornecedores);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/fornecedores", requireAuth, requireRole("gestor"), requireFilial, validateBody(insertFornecedorSchema), async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      
      const fornecedor = await storage.createFornecedor({
        ...req.body,
        filialId,
      });

      await storage.createAuditLog({
        acao: "create",
        entidade: "fornecedor",
        entidadeId: fornecedor.id,
        userId: user.id,
        filialId,
        dadosDepois: JSON.stringify(fornecedor),
      });

      res.status(201).json(fornecedor);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/fornecedores/:id", requireAuth, requireRole("gestor"), requireFilial, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      const before = await storage.getFornecedor(req.params.id);
      
      if (!before) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }
      
      if (before.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este fornecedor" });
      }
      
      // Prevent filialId from being changed via PATCH
      const { filialId: _, ...updateData } = req.body;
      const fornecedor = await storage.updateFornecedor(req.params.id, updateData);

      await storage.createAuditLog({
        acao: "update",
        entidade: "fornecedor",
        entidadeId: fornecedor.id,
        userId: user.id,
        filialId: fornecedor.filialId,
        dadosAntes: JSON.stringify(before),
        dadosDepois: JSON.stringify(fornecedor),
      });

      res.json(fornecedor);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/fornecedores/:id", requireAuth, requireRole("gestor"), requireFilial, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      const fornecedor = await storage.getFornecedor(req.params.id);
      
      if (!fornecedor) {
        return res.status(404).json({ error: "Fornecedor não encontrado" });
      }
      
      if (fornecedor.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este fornecedor" });
      }

      await storage.deleteFornecedor(req.params.id);

      await storage.createAuditLog({
        acao: "delete",
        entidade: "fornecedor",
        entidadeId: req.params.id,
        userId: user.id,
        filialId: fornecedor.filialId,
        dadosAntes: JSON.stringify(fornecedor),
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ==================== Status Caminhão Routes ====================
  
  app.get("/api/status-caminhao", requireAuth, requireFilial, async (req, res, next) => {
    try {
      const filialId = (req as any).filialId as string;
      const status = await storage.getStatusCaminhaoByFilial(filialId);
      res.json(status);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/status-caminhao", requireAuth, requireRole("gestor"), requireFilial, validateBody(insertStatusCaminhaoSchema), async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      
      const status = await storage.createStatusCaminhao({
        ...req.body,
        filialId,
      });

      await storage.createAuditLog({
        acao: "create",
        entidade: "status_caminhao",
        entidadeId: status.id,
        userId: user.id,
        filialId,
        dadosDepois: JSON.stringify(status),
      });

      res.status(201).json(status);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/status-caminhao/:id", requireAuth, requireRole("gestor"), requireFilial, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      const before = await storage.getStatusCaminhao(req.params.id);
      
      if (!before) {
        return res.status(404).json({ error: "Status não encontrado" });
      }
      
      if (before.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este status" });
      }
      
      // Prevent filialId from being changed via PATCH
      const { filialId: _, ...updateData } = req.body;
      const status = await storage.updateStatusCaminhao(req.params.id, updateData);

      await storage.createAuditLog({
        acao: "update",
        entidade: "status_caminhao",
        entidadeId: status.id,
        userId: user.id,
        filialId: status.filialId,
        dadosAntes: JSON.stringify(before),
        dadosDepois: JSON.stringify(status),
      });

      res.json(status);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/status-caminhao/:id", requireAuth, requireRole("gestor"), requireFilial, async (req, res, next) => {
    try {
      const user = (req as any).user as User;
      const filialId = (req as any).filialId as string;
      const status = await storage.getStatusCaminhao(req.params.id);
      
      if (!status) {
        return res.status(404).json({ error: "Status não encontrado" });
      }
      
      if (status.filialId !== filialId) {
        return res.status(403).json({ error: "Acesso negado a este status" });
      }

      await storage.deleteStatusCaminhao(req.params.id);

      await storage.createAuditLog({
        acao: "delete",
        entidade: "status_caminhao",
        entidadeId: req.params.id,
        userId: user.id,
        filialId: status.filialId,
        dadosAntes: JSON.stringify(status),
      });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ==================== Audit Logs Routes ====================
  
  app.get("/api/audit-logs", requireAuth, requireRole("gestor"), async (req, res, next) => {
    try {
      const logs = await storage.getAllAuditLogs();
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  // ==================== WebSocket Setup ====================
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<WebSocket, string>(); // Map WebSocket to filialId

  wss.on('connection', (ws, req) => {
    // Extract filialId from query parameter
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const filialId = url.searchParams.get('filialId');

    if (!filialId) {
      console.log('WebSocket connection rejected: missing filialId');
      ws.close(1008, 'Missing filialId parameter');
      return;
    }

    clients.set(ws, filialId);
    console.log(`WebSocket client connected for filial ${filialId}. Total clients: ${clients.size}`);

    ws.on('close', () => {
      clients.delete(ws);
      console.log(`WebSocket client disconnected. Total clients: ${clients.size}`);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });

  // Broadcast to all clients or filter by filialId
  function broadcastToClients(message: any, targetFilialId?: string) {
    const data = JSON.stringify(message);
    clients.forEach((clientFilialId, client) => {
      if (client.readyState === WebSocket.OPEN) {
        // If targetFilialId is specified, only send to matching clients
        if (!targetFilialId || clientFilialId === targetFilialId) {
          client.send(data);
        }
      }
    });
  }

  return httpServer;
}
