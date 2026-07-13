import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, UserLoginBody } from "@workspace/api-zod";
import { EmailService } from "@workspace/email";
import { z } from "zod/v4";
import { JWT_SECRET } from "../lib/jwtSecret.js";
import { userAuth, AuthRequest } from "../middleware/userAuth.js";
import {
  loginIpRateLimit,
  accountLockoutGuard,
  checkAccountLockout,
  recordFailedLogin,
  resetLoginFailures,
} from "../middleware/loginRateLimit.js";

const router = Router();

const JWT_EXPIRES = "7d";

function makeToken(user: { id: number; name: string; email: string; role: string }) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

function toProfile(user: typeof usersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

// POST /auth/register (comportement existant préservé + rôle + email bienvenue)
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = RegisterBody.parse(req.body);
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Cette adresse email est déjà utilisée." });
      return;
    }
    // Seuls "customer" et "merchant" sont sélectionnables à l'inscription ; "moderator" reste réservé à l'admin.
    const safeRole: "customer" | "merchant" = role === "merchant" ? "merchant" : "customer";
    const passwordHash = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const [user] = await db.insert(usersTable).values({
      name, email, passwordHash,
      role: safeRole,
      emailVerifyToken: verifyToken,
      emailVerifyTokenExpires: verifyExpires,
    }).returning();
    const token = makeToken(user);
    // Non-bloquant — ne doit pas faire échouer l'inscription
    EmailService.sendWelcome(email, name).catch((err) => req.log.error({ err }, "Échec envoi email de bienvenue"));
    res.status(201).json({ token, user: toProfile(user) });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

// POST /auth/login (comportement existant préservé + rôle dans le token)
router.post("/auth/login", loginIpRateLimit, accountLockoutGuard, async (req, res) => {
  try {
    const { email, password } = UserLoginBody.parse(req.body);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      recordFailedLogin(email);
      res.status(401).json({ error: "Identifiants incorrects." });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      recordFailedLogin(email);
      const { retryAfterSeconds } = checkAccountLockout(email);
      res.status(401).json({ error: "Identifiants incorrects.", retryAfterSeconds });
      return;
    }
    resetLoginFailures(email);
    await db.update(usersTable).set({ lastLoginAt: new Date() }).where(eq(usersTable.id, user.id));
    const token = makeToken(user);
    res.json({ token, user: toProfile(user) });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

// GET /auth/me (comportement existant préservé + champs étendus)
router.get("/auth/me", userAuth, async (req: AuthRequest, res) => {
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) { res.status(401).json({ error: "Utilisateur introuvable." }); return; }
    res.json(toProfile(user));
  } catch (err) {
    req.log.error(err);
    res.status(401).json({ error: "Token invalide ou expiré." });
  }
});

// POST /auth/forgot-password
router.post("/auth/forgot-password", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);
      await db.update(usersTable).set({ resetToken: token, resetTokenExpires: expires }).where(eq(usersTable.id, user.id));
      EmailService.sendPasswordReset(email, user.name, token).catch((err) => req.log.error({ err }, "Échec envoi email de réinitialisation"));
    }
    res.json({ message: "Si cette adresse est enregistrée, un email de réinitialisation vous a été envoyé." });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

// POST /auth/reset-password
router.post("/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = z.object({ token: z.string().min(1), password: z.string().min(8) }).parse(req.body);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.resetToken, token)).limit(1);
    if (!user || !user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      res.status(400).json({ error: "Lien de réinitialisation invalide ou expiré." }); return;
    }
    const passwordHash = await bcrypt.hash(password, 12);
    await db.update(usersTable).set({ passwordHash, resetToken: null, resetTokenExpires: null }).where(eq(usersTable.id, user.id));
    res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

// PUT /auth/profile — update own profile (name, password, phone — email non modifiable)
router.put("/auth/profile", userAuth, async (req: AuthRequest, res) => {
  try {
    const data = z.object({
      name: z.string().min(2).optional(),
      password: z.string().min(8).optional(),
      phone: z.string().optional(),
    }).parse(req.body);

    const userId = req.user!.id;
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "Aucune donnée à mettre à jour" });
      return;
    }

    const [updated] = await db.update(usersTable)
      .set(updateData as Partial<typeof usersTable.$inferInsert>)
      .where(eq(usersTable.id, userId))
      .returning();
    if (!updated) { res.status(404).json({ error: "Utilisateur introuvable" }); return; }
    res.json(toProfile(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

// POST /auth/verify-email
router.post("/auth/verify-email", async (req, res) => {
  try {
    const { token } = z.object({ token: z.string().min(1) }).parse(req.body);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.emailVerifyToken, token)).limit(1);
    if (!user || !user.emailVerifyTokenExpires || user.emailVerifyTokenExpires < new Date()) {
      res.status(400).json({ error: "Lien de vérification invalide ou expiré." }); return;
    }
    await db.update(usersTable).set({ emailVerified: true, emailVerifyToken: null, emailVerifyTokenExpires: null }).where(eq(usersTable.id, user.id));
    res.json({ message: "Email vérifié avec succès." });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

export default router;
