import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../lib/jwtSecret.js";

export interface AdminJwtPayload {
  sub: string;
  role: "root" | "admin";
  iat?: number;
  exp?: number;
}

function verifyAdminJwt(token: string): AdminJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminJwtPayload;
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | undefined {
  const authHeader = req.headers.authorization;
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : (req.headers["x-admin-token"] as string | undefined);
}

export function adminAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(401).json({ error: "Accès non autorisé" });
    return;
  }

  const payload = verifyAdminJwt(token);
  if (!payload) {
    res.status(401).json({ error: "Token invalide ou expiré" });
    return;
  }

  const r = req as Request & { adminRole: string; adminPayload: AdminJwtPayload };
  r.adminRole = payload.role;
  r.adminPayload = payload;
  next();
}

export function rootAuth(req: Request, res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    res.status(403).json({ error: "Accès réservé au root admin" });
    return;
  }

  const payload = verifyAdminJwt(token);
  if (!payload || payload.role !== "root") {
    res.status(403).json({ error: "Accès réservé au root admin" });
    return;
  }

  const r = req as Request & { adminRole: string; adminPayload: AdminJwtPayload };
  r.adminRole = payload.role;
  r.adminPayload = payload;
  next();
}

/**
 * Helper exported for the login route only — kept here so that
 * the role/sub extraction logic lives in one place.
 */
export function getJwtRole(payload: AdminJwtPayload): "root" | "admin" {
  return payload.role === "root" ? "root" : "admin";
}
