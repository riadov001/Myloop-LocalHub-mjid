import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { JWT_SECRET } from "../lib/jwtSecret.js";

export interface AuthPayload {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

function extractBearer(req: Request): string | undefined {
  const auth = req.headers.authorization;
  return auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
}

/** Middleware : vérifie le JWT et injecte req.user. Rejette avec 401 si absent/invalide.
 * Vérifie aussi en base que le compte n'est pas suspendu — un jeton déjà émis pour un
 * compte suspendu doit être rejeté immédiatement, pas seulement au prochain login. */
export async function userAuth(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({ error: "Authentification requise." });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    const [user] = await db.select({ isSuspended: usersTable.isSuspended }).from(usersTable).where(eq(usersTable.id, payload.id)).limit(1);
    if (!user || user.isSuspended) {
      res.status(403).json({ error: "Ce compte a été suspendu." });
      return;
    }
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Token invalide ou expiré." });
  }
}

/** Middleware : authentification optionnelle — injecte req.user si token valide, continue sinon. */
export function optionalUserAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const token = extractBearer(req);
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET) as AuthPayload;
    } catch {
      // Token invalide ignoré en mode optionnel
    }
  }
  next();
}

/** Middleware : vérifie qu'un rôle spécifique est requis. Doit être utilisé après userAuth. */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentification requise." });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: `Accès refusé. Rôle requis : ${roles.join(" ou ")}.` });
      return;
    }
    next();
  };
}
