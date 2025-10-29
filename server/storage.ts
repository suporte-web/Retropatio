// Reference: blueprint:javascript_database
import {
  users,
  filiais,
  userPermissions,
  veiculos,
  vagas,
  visitantes,
  chamadas,
  auditLogs,
  refreshTokens,
  notifications,
  type User,
  type InsertUser,
  type Filial,
  type InsertFilial,
  type UserPermission,
  type InsertUserPermission,
  type Veiculo,
  type InsertVeiculo,
  type Vaga,
  type InsertVaga,
  type Visitante,
  type InsertVisitante,
  type Chamada,
  type InsertChamada,
  type AuditLog,
  type InsertAuditLog,
  type RefreshToken,
  type InsertRefreshToken,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, gte, lt } from "drizzle-orm";

export interface IStorage {
  // Refresh Token methods
  createRefreshToken(token: InsertRefreshToken): Promise<RefreshToken>;
  getRefreshToken(token: string): Promise<RefreshToken | undefined>;
  deleteRefreshToken(token: string): Promise<void>;
  deleteExpiredTokens(): Promise<void>;

  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, data: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  incrementLoginAttempts(id: string): Promise<void>;
  resetLoginAttempts(id: string): Promise<void>;

  // Filial methods
  getFilial(id: string): Promise<Filial | undefined>;
  getFilialByCode(codigo: string): Promise<Filial | undefined>;
  createFilial(filial: InsertFilial): Promise<Filial>;
  updateFilial(id: string, data: Partial<Filial>): Promise<Filial>;
  getAllFiliais(): Promise<Filial[]>;

  // User Permission methods
  getUserPermissions(userId: string): Promise<UserPermission[]>;
  createUserPermission(permission: InsertUserPermission): Promise<UserPermission>;
  deleteUserPermission(id: string): Promise<void>;
  getUserFilialIds(userId: string): Promise<string[]>;

  // Veiculo methods
  getVeiculo(id: string): Promise<Veiculo | undefined>;
  getVeiculosByFilial(filialId: string): Promise<Veiculo[]>;
  getAllVeiculos(): Promise<Veiculo[]>;
  createVeiculo(veiculo: InsertVeiculo & { registradoPor: string }): Promise<Veiculo>;
  updateVeiculo(id: string, data: Partial<Veiculo>): Promise<Veiculo>;
  registrarSaida(id: string): Promise<Veiculo>;

  // Vaga methods
  getVaga(id: string): Promise<Vaga | undefined>;
  getVagasByFilial(filialId: string): Promise<Vaga[]>;
  createVaga(vaga: InsertVaga): Promise<Vaga>;
  updateVaga(id: string, data: Partial<Vaga>): Promise<Vaga>;

  // Visitante methods
  getVisitante(id: string): Promise<Visitante | undefined>;
  getVisitantesByFilial(filialId: string): Promise<Visitante[]>;
  createVisitante(visitante: InsertVisitante): Promise<Visitante>;
  updateVisitante(id: string, data: Partial<Visitante>): Promise<Visitante>;

  // Chamada methods
  getChamada(id: string): Promise<Chamada | undefined>;
  getChamadasByFilial(filialId: string): Promise<Chamada[]>;
  createChamada(chamada: InsertChamada): Promise<Chamada>;
  updateChamada(id: string, data: Partial<Chamada>): Promise<Chamada>;

  // Notification methods
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  getUnreadNotificationsByUser(userId: string): Promise<Notification[]>;
  getUnreadCountByUser(userId: string): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markAsRead(id: string): Promise<Notification>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(id: string): Promise<void>;

  // Audit Log methods
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAllAuditLogs(): Promise<AuditLog[]>;
}

export class DatabaseStorage implements IStorage {
  // Refresh Token methods
  async createRefreshToken(token: InsertRefreshToken): Promise<RefreshToken> {
    const [t] = await db.insert(refreshTokens).values(token).returning();
    return t;
  }

  async getRefreshToken(token: string): Promise<RefreshToken | undefined> {
    const [t] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
    return t || undefined;
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, token));
  }

  async deleteExpiredTokens(): Promise<void> {
    await db.delete(refreshTokens).where(lt(refreshTokens.expiresAt, new Date()));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async incrementLoginAttempts(id: string): Promise<void> {
    const user = await this.getUser(id);
    if (!user) return;

    const attempts = (user.loginAttempts || 0) + 1;
    const updates: Partial<User> = { loginAttempts: attempts };

    // Lock account after 5 failed attempts for 15 minutes
    if (attempts >= 5) {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);
      updates.lockedUntil = lockUntil;
    }

    await this.updateUser(id, updates);
  }

  async resetLoginAttempts(id: string): Promise<void> {
    await this.updateUser(id, { loginAttempts: 0, lockedUntil: null });
  }

  // Filial methods
  async getFilial(id: string): Promise<Filial | undefined> {
    const [filial] = await db.select().from(filiais).where(eq(filiais.id, id));
    return filial || undefined;
  }

  async getFilialByCode(codigo: string): Promise<Filial | undefined> {
    const [filial] = await db.select().from(filiais).where(eq(filiais.codigo, codigo));
    return filial || undefined;
  }

  async createFilial(insertFilial: InsertFilial): Promise<Filial> {
    const [filial] = await db.insert(filiais).values(insertFilial).returning();
    return filial;
  }

  async updateFilial(id: string, data: Partial<Filial>): Promise<Filial> {
    const [filial] = await db.update(filiais).set(data).where(eq(filiais.id, id)).returning();
    return filial;
  }

  async getAllFiliais(): Promise<Filial[]> {
    return await db.select().from(filiais);
  }

  // User Permission methods
  async getUserPermissions(userId: string): Promise<UserPermission[]> {
    return await db.select().from(userPermissions).where(eq(userPermissions.userId, userId));
  }

  async createUserPermission(permission: InsertUserPermission): Promise<UserPermission> {
    const [perm] = await db.insert(userPermissions).values(permission).returning();
    return perm;
  }

  async deleteUserPermission(id: string): Promise<void> {
    await db.delete(userPermissions).where(eq(userPermissions.id, id));
  }

  async getUserFilialIds(userId: string): Promise<string[]> {
    const perms = await db.select({ filialId: userPermissions.filialId })
      .from(userPermissions)
      .where(eq(userPermissions.userId, userId));
    return perms.map(p => p.filialId);
  }

  // Veiculo methods
  async getVeiculo(id: string): Promise<Veiculo | undefined> {
    const [veiculo] = await db.select().from(veiculos).where(eq(veiculos.id, id));
    return veiculo || undefined;
  }

  async getVeiculosByFilial(filialId: string): Promise<Veiculo[]> {
    return await db.select().from(veiculos)
      .where(eq(veiculos.filialId, filialId))
      .orderBy(desc(veiculos.dataEntrada));
  }

  async getAllVeiculos(): Promise<Veiculo[]> {
    return await db.select().from(veiculos).orderBy(desc(veiculos.dataEntrada));
  }

  async createVeiculo(veiculo: InsertVeiculo & { registradoPor: string }): Promise<Veiculo> {
    const [v] = await db.insert(veiculos).values(veiculo).returning();
    
    // Update vaga status if vaga is assigned
    if (v.vagaId) {
      await this.updateVaga(v.vagaId, { status: "ocupada" });
    }
    
    return v;
  }

  async updateVeiculo(id: string, data: Partial<Veiculo>): Promise<Veiculo> {
    const [v] = await db.update(veiculos)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(veiculos.id, id))
      .returning();
    return v;
  }

  async registrarSaida(id: string): Promise<Veiculo> {
    const veiculo = await this.getVeiculo(id);
    if (!veiculo) throw new Error("Veículo não encontrado");

    // Free up the vaga
    if (veiculo.vagaId) {
      await this.updateVaga(veiculo.vagaId, { status: "livre" });
    }

    return await this.updateVeiculo(id, { dataSaida: new Date() });
  }

  // Vaga methods
  async getVaga(id: string): Promise<Vaga | undefined> {
    const [vaga] = await db.select().from(vagas).where(eq(vagas.id, id));
    return vaga || undefined;
  }

  async getVagasByFilial(filialId: string): Promise<Vaga[]> {
    return await db.select().from(vagas).where(eq(vagas.filialId, filialId));
  }

  async createVaga(vaga: InsertVaga): Promise<Vaga> {
    const [v] = await db.insert(vagas).values(vaga).returning();
    return v;
  }

  async updateVaga(id: string, data: Partial<Vaga>): Promise<Vaga> {
    const [v] = await db.update(vagas)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(vagas.id, id))
      .returning();
    return v;
  }

  // Visitante methods
  async getVisitante(id: string): Promise<Visitante | undefined> {
    const [visitante] = await db.select().from(visitantes).where(eq(visitantes.id, id));
    return visitante || undefined;
  }

  async getVisitantesByFilial(filialId: string): Promise<Visitante[]> {
    return await db.select().from(visitantes)
      .where(eq(visitantes.filialId, filialId))
      .orderBy(desc(visitantes.createdAt));
  }

  async createVisitante(visitante: InsertVisitante): Promise<Visitante> {
    const [v] = await db.insert(visitantes).values(visitante).returning();
    return v;
  }

  async updateVisitante(id: string, data: Partial<Visitante>): Promise<Visitante> {
    const [v] = await db.update(visitantes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(visitantes.id, id))
      .returning();
    return v;
  }

  // Chamada methods
  async getChamada(id: string): Promise<Chamada | undefined> {
    const [chamada] = await db.select().from(chamadas).where(eq(chamadas.id, id));
    return chamada || undefined;
  }

  async getChamadasByFilial(filialId: string): Promise<Chamada[]> {
    return await db.select().from(chamadas)
      .where(eq(chamadas.filialId, filialId))
      .orderBy(desc(chamadas.createdAt));
  }

  async createChamada(chamada: InsertChamada): Promise<Chamada> {
    const [c] = await db.insert(chamadas).values(chamada).returning();
    return c;
  }

  async updateChamada(id: string, data: Partial<Chamada>): Promise<Chamada> {
    const [c] = await db.update(chamadas)
      .set(data)
      .where(eq(chamadas.id, id))
      .returning();
    return c;
  }

  // Notification methods
  async getNotification(id: string): Promise<Notification | undefined> {
    const [notification] = await db.select().from(notifications).where(eq(notifications.id, id));
    return notification || undefined;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(50);
  }

  async getUnreadNotificationsByUser(userId: string): Promise<Notification[]> {
    return await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.status, "nao_lida")
      ))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadCountByUser(userId: string): Promise<number> {
    const results = await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.status, "nao_lida")
      ));
    return results.length;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [n] = await db.insert(notifications).values(notification).returning();
    return n;
  }

  async markAsRead(id: string): Promise<Notification> {
    const [n] = await db.update(notifications)
      .set({ status: "lida", readAt: new Date() })
      .where(eq(notifications.id, id))
      .returning();
    return n;
  }

  async markAllAsRead(userId: string): Promise<void> {
    await db.update(notifications)
      .set({ status: "lida", readAt: new Date() })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.status, "nao_lida")
      ));
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  // Audit Log methods
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [l] = await db.insert(auditLogs).values(log).returning();
    return l;
  }

  async getAllAuditLogs(): Promise<AuditLog[]> {
    return await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(1000);
  }
}

export const storage = new DatabaseStorage();
