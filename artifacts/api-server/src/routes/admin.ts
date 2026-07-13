import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db, adminUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AdminLoginBody } from "@workspace/api-zod";
import { ROOT_PASSWORD, ROOT_EMAIL } from "../lib/rootCredentials.js";
import { EmailService } from "@workspace/email";
import { JWT_SECRET } from "../lib/jwtSecret.js";
import { adminAuth, AdminJwtPayload } from "../middleware/adminAuth.js";
import {
  loginIpRateLimit,
  accountLockoutGuard,
  checkAccountLockout,
  recordFailedLogin,
  resetLoginFailures,
} from "../middleware/loginRateLimit.js";
import { z } from "zod/v4";

const router = Router();


const JWT_EXPIRY = "8h";

function signAdminToken(payload: Omit<AdminJwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}

// POST /admin/login — checks root hardcoded creds first, then DB admin users
router.post("/admin/login", loginIpRateLimit, accountLockoutGuard, async (req, res) => {
  try {
    const { email, password } = AdminLoginBody.parse(req.body);

    // Root admin (hardcoded credentials — issues a signed JWT)
    if (email === ROOT_EMAIL && password === ROOT_PASSWORD) {
      resetLoginFailures(email);
      const token = signAdminToken({ sub: "root", role: "root" });
      res.json({ success: true, token, role: "root" });
      return;
    }

    // DB admin users
    const [user] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, email));

    if (user && user.isActive) {
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (valid) {
        resetLoginFailures(email);
        await db
          .update(adminUsersTable)
          .set({ lastLoginAt: new Date() })
          .where(eq(adminUsersTable.id, user.id));
        const token = signAdminToken({ sub: String(user.id), role: user.role as "root" | "admin" });
        res.json({ success: true, token, role: user.role });
        return;
      }
    }

    recordFailedLogin(email);
    const { retryAfterSeconds } = checkAccountLockout(email);
    res.status(401).json({ success: false, token: "", role: null, retryAfterSeconds });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid credentials format" });
  }
});

// POST /admin/refresh — exchange a valid JWT for a fresh one (same role/sub)
// Note: only accepts JWT tokens — legacy static tokens are rejected by adminAuth
router.post("/admin/refresh", adminAuth, (req, res) => {
  const r = req as typeof req & { adminRole: string; adminPayload: AdminJwtPayload };
  const token = signAdminToken({ sub: r.adminPayload.sub, role: r.adminPayload.role });
  res.json({ token, role: r.adminPayload.role });
});

// POST /admin/forgot-password — envoie un email de réinitialisation aux admins DB (pas root)
router.post("/admin/forgot-password", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const [user] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, email));

    if (user && user.isActive) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiry = new Date(Date.now() + 60 * 60 * 1000);
      await db
        .update(adminUsersTable)
        .set({ resetToken: token, resetTokenExpiry: expiry })
        .where(eq(adminUsersTable.id, user.id));
      EmailService.sendAdminPasswordReset(email, user.name, token).catch((err) =>
        req.log.error({ err }, "Échec envoi email reset admin")
      );
    }
    res.json({ message: "Si cet email est associé à un compte admin, un lien de réinitialisation a été envoyé." });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

// POST /admin/reset-password — valide le token et met à jour le mot de passe
router.post("/admin/reset-password", async (req, res) => {
  try {
    const { token, password } = z
      .object({ token: z.string().min(1), password: z.string().min(8) })
      .parse(req.body);

    const [user] = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.resetToken, token));

    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      res.status(400).json({ error: "Lien de réinitialisation invalide ou expiré." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await db
      .update(adminUsersTable)
      .set({ passwordHash, resetToken: null, resetTokenExpiry: null })
      .where(eq(adminUsersTable.id, user.id));

    res.json({ message: "Mot de passe réinitialisé avec succès." });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

export default router;
