import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.SESSION_SECRET || "dev-secret";
const JWT_EXPIRES_IN = "15m";
const REFRESH_EXPIRES_IN = "7d";

export type JWTPayload = {
  userId: string;
  username: string;
  role: string;
};

export function signAccessToken(payload: JWTPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
