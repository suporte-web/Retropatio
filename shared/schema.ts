import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["porteiro", "cliente", "gestor"]);
export const visitanteStatusEnum = pgEnum("visitante_status", ["aguardando", "aprovado", "dentro", "saiu"]);
export const vagaStatusEnum = pgEnum("vaga_status", ["livre", "ocupada"]);
export const veiculoSituacaoEnum = pgEnum("veiculo_situacao", ["aguardando", "docado", "carregando", "descarregando", "finalizado"]);
export const checklistTipoEnum = pgEnum("checklist_tipo", ["inspecao_entrada", "inspecao_saida", "vistoria_carga", "conferencia_documentos"]);
export const checklistStatusEnum = pgEnum("checklist_status", ["pendente", "em_andamento", "concluido"]);
export const checklistItemTipoEnum = pgEnum("checklist_item_tipo", ["checkbox", "texto", "foto", "numero"]);

// Filiais (branches) - Master table
export const filiais = pgTable("filiais", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  nome: text("nome").notNull(),
  codigo: text("codigo").notNull().unique(), // guarulhos, araraquara, costeira
  endereco: text("endereco").notNull(),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const filiaisRelations = relations(filiais, ({ many }) => ({
  userPermissions: many(userPermissions),
  vagas: many(vagas),
}));

// Users
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  nome: text("nome").notNull(),
  role: roleEnum("role").notNull().default("porteiro"),
  ativo: boolean("ativo").notNull().default(true),
  loginAttempts: integer("login_attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  permissions: many(userPermissions),
  auditLogs: many(auditLogs),
  veiculosRegistrados: many(veiculos),
}));

// User Permissions per Branch
export const userPermissions = pgTable("user_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filialId: varchar("filial_id").notNull().references(() => filiais.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userPermissionsRelations = relations(userPermissions, ({ one }) => ({
  user: one(users, {
    fields: [userPermissions.userId],
    references: [users.id],
  }),
  filial: one(filiais, {
    fields: [userPermissions.filialId],
    references: [filiais.id],
  }),
}));

// Veículos (Vehicles)
export const veiculos = pgTable("veiculos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filialId: varchar("filial_id").notNull().references(() => filiais.id),
  placaCavalo: text("placa_cavalo").notNull(),
  placaCarreta: text("placa_carreta"),
  motorista: text("motorista").notNull(),
  cpfMotorista: text("cpf_motorista"),
  transportadora: text("transportadora"),
  cliente: text("cliente"),
  doca: text("doca"),
  vagaId: varchar("vaga_id").references(() => vagas.id),
  situacao: veiculoSituacaoEnum("situacao").notNull().default("aguardando"),
  observacoes: text("observacoes"),
  dataEntrada: timestamp("data_entrada").notNull().defaultNow(),
  dataSaida: timestamp("data_saida"),
  registradoPor: varchar("registrado_por").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const veiculosRelations = relations(veiculos, ({ one }) => ({
  filial: one(filiais, {
    fields: [veiculos.filialId],
    references: [filiais.id],
  }),
  vaga: one(vagas, {
    fields: [veiculos.vagaId],
    references: [vagas.id],
  }),
  registrador: one(users, {
    fields: [veiculos.registradoPor],
    references: [users.id],
  }),
}));

// Vagas (Parking Spots)
export const vagas = pgTable("vagas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filialId: varchar("filial_id").notNull().references(() => filiais.id),
  numero: text("numero").notNull(),
  status: vagaStatusEnum("status").notNull().default("livre"),
  descricao: text("descricao"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vagasRelations = relations(vagas, ({ one, many }) => ({
  filial: one(filiais, {
    fields: [vagas.filialId],
    references: [filiais.id],
  }),
  veiculos: many(veiculos),
}));

// Visitantes (Visitors)
export const visitantes = pgTable("visitantes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filialId: varchar("filial_id").notNull().references(() => filiais.id),
  nome: text("nome").notNull(),
  cpf: text("cpf").notNull(),
  empresa: text("empresa"),
  tipoVisita: text("tipo_visita").notNull(), // visitante, prestador_servico
  motivoVisita: text("motivo_visita"),
  status: visitanteStatusEnum("status").notNull().default("aguardando"),
  dataEntrada: timestamp("data_entrada"),
  dataSaida: timestamp("data_saida"),
  aprovadoPor: varchar("aprovado_por").references(() => users.id),
  dataAprovacao: timestamp("data_aprovacao"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const visitantesRelations = relations(visitantes, ({ one }) => ({
  filial: one(filiais, {
    fields: [visitantes.filialId],
    references: [filiais.id],
  }),
  aprovador: one(users, {
    fields: [visitantes.aprovadoPor],
    references: [users.id],
  }),
}));

// Chamadas de Motorista (Driver Calls)
export const chamadas = pgTable("chamadas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filialId: varchar("filial_id").notNull().references(() => filiais.id),
  veiculoId: varchar("veiculo_id").notNull().references(() => veiculos.id),
  motivo: text("motivo").notNull(),
  status: text("status").notNull().default("pendente"), // pendente, atendida, cancelada
  criadoPor: varchar("criado_por").notNull().references(() => users.id),
  atendidoPor: varchar("atendido_por").references(() => users.id),
  dataAtendimento: timestamp("data_atendimento"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chamadasRelations = relations(chamadas, ({ one }) => ({
  filial: one(filiais, {
    fields: [chamadas.filialId],
    references: [filiais.id],
  }),
  veiculo: one(veiculos, {
    fields: [chamadas.veiculoId],
    references: [veiculos.id],
  }),
  criador: one(users, {
    fields: [chamadas.criadoPor],
    references: [users.id],
  }),
  atendente: one(users, {
    fields: [chamadas.atendidoPor],
    references: [users.id],
  }),
}));

// Checklists (defined first)
export const checklists = pgTable("checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filialId: varchar("filial_id").notNull().references(() => filiais.id),
  veiculoId: varchar("veiculo_id").notNull().references(() => veiculos.id),
  tipo: checklistTipoEnum("tipo").notNull(),
  status: checklistStatusEnum("status").notNull().default("pendente"),
  criadoPor: varchar("criado_por").notNull().references(() => users.id),
  concluidoPor: varchar("concluido_por").references(() => users.id),
  dataConclusao: timestamp("data_conclusao"),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Checklist Items
export const checklistItems = pgTable("checklist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  checklistId: varchar("checklist_id").notNull().references(() => checklists.id, { onDelete: "cascade" }),
  descricao: text("descricao").notNull(),
  ordem: integer("ordem").notNull(),
  tipo: checklistItemTipoEnum("tipo").notNull().default("checkbox"),
  valor: text("valor"),
  obrigatorio: boolean("obrigatorio").notNull().default(false),
  fotos: text("fotos").array(),
  observacoes: text("observacoes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const checklistsRelations = relations(checklists, ({ one, many }) => ({
  filial: one(filiais, {
    fields: [checklists.filialId],
    references: [filiais.id],
  }),
  veiculo: one(veiculos, {
    fields: [checklists.veiculoId],
    references: [veiculos.id],
  }),
  criador: one(users, {
    fields: [checklists.criadoPor],
    references: [users.id],
  }),
  responsavel: one(users, {
    fields: [checklists.concluidoPor],
    references: [users.id],
  }),
  items: many(checklistItems),
}));

export const checklistItemsRelations = relations(checklistItems, ({ one }) => ({
  checklist: one(checklists, {
    fields: [checklistItems.checklistId],
    references: [checklists.id],
  }),
}));

// Refresh Tokens
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  filialId: varchar("filial_id").references(() => filiais.id),
  acao: text("acao").notNull(), // LOGIN, CRIAR_VEICULO, APROVAR_VISITANTE, etc
  entidade: text("entidade").notNull(), // users, veiculos, visitantes, etc
  entidadeId: varchar("entidade_id"),
  dadosAntes: text("dados_antes"), // JSON string
  dadosDepois: text("dados_depois"), // JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
  filial: one(filiais, {
    fields: [auditLogs.filialId],
    references: [filiais.id],
  }),
}));

// Zod Schemas for Insert
export const insertFilialSchema = createInsertSchema(filiais).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  loginAttempts: true,
  lockedUntil: true,
});
export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({ id: true, createdAt: true });
export const insertVeiculoSchema = createInsertSchema(veiculos).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  dataEntrada: true,
});
export const insertVagaSchema = createInsertSchema(vagas).omit({ id: true, createdAt: true, updatedAt: true });
export const insertVisitanteSchema = createInsertSchema(visitantes).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  dataAprovacao: true,
});
export const insertChamadaSchema = createInsertSchema(chamadas).omit({ id: true, createdAt: true });
export const insertChecklistSchema = createInsertSchema(checklists).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  dataConclusao: true,
});
export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
});
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });
export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({ id: true, createdAt: true });

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().min(1, "Password é obrigatório"),
});

export const registerSchema = insertUserSchema.extend({
  password: z.string().min(6, "Password deve ter no mínimo 6 caracteres"),
}).omit({ role: true }); // Remove role from registration - will be set by admin

export const refreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token é obrigatório"),
});

// Types for Select
export type Filial = typeof filiais.$inferSelect;
export type User = typeof users.$inferSelect;
export type UserPermission = typeof userPermissions.$inferSelect;
export type Veiculo = typeof veiculos.$inferSelect;
export type Vaga = typeof vagas.$inferSelect;
export type Visitante = typeof visitantes.$inferSelect;
export type Chamada = typeof chamadas.$inferSelect;
export type Checklist = typeof checklists.$inferSelect;
export type ChecklistItem = typeof checklistItems.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;

// Types for Insert
export type InsertFilial = z.infer<typeof insertFilialSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;
export type InsertVeiculo = z.infer<typeof insertVeiculoSchema>;
export type InsertVaga = z.infer<typeof insertVagaSchema>;
export type InsertVisitante = z.infer<typeof insertVisitanteSchema>;
export type InsertChamada = z.infer<typeof insertChamadaSchema>;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
