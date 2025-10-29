import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { type User } from "@shared/schema";

const scryptAsync = promisify(scrypt);

// JWT configuration
const JWT_SECRET = process.env.SESSION_SECRET || "default-secret-change-in-production";
const JWT_EXPIRES_IN = "15m"; // 15 minutes
const REFRESH_TOKEN_EXPIRES_IN = "7d"; // 7 days

export interface JWTPayload {
  userId: string;
  username: string;
  role: string;
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function generateAccessToken(user: User): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function generateRefreshToken(user: User): string {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

// Remove sensitive fields from user object
export function sanitizeUser(user: User) {
  const { password, loginAttempts, lockedUntil, ...sanitized } = user;
  return sanitized;
}

// Middleware to verify JWT token
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Token não fornecido" });
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    const user = await storage.getUser(payload.userId);
    
    if (!user || !user.ativo) {
      return res.status(401).json({ error: "Usuário inválido ou inativo" });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: "Token expirado" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: "Token inválido" });
    }
    return res.status(500).json({ error: "Erro ao verificar token" });
  }
}

// Middleware to require specific role
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user as User;
    
    if (!user) {
      return res.status(401).json({ error: "Não autenticado" });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    next();
  };
}
