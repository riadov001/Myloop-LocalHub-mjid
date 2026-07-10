import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, adminUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AdminLoginBody } from "@workspace/api-zod";
import { ROOT_PASSWORD } from "../lib/rootCredentials.js";

const router = Router();

export const ROOT_EMAIL = process.env.ROOT_ADMIN_EMAIL ?? "rbelmahi90@gmail.com";
export const ROOT_TOKEN = "localmarket-root-token-2026";
export const ADMIN_TOKEN_PREFIX = "localmarket-admin-token-2026";

// POST /admin/login — checks root hardcoded creds first, then DB admin users
router.post("/admin/login", async (req, res) => {
  try {
    const { email, password } = AdminLoginBody.parse(req.body);

    // Root admin (hardcoded — always works)
    if (email === ROOT_EMAIL && password === ROOT_PASSWORD) {
      res.json({ success: true, token: ROOT_TOKEN, role: "root" });
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
        await db
          .update(adminUsersTable)
          .set({ lastLoginAt: new Date() })
          .where(eq(adminUsersTable.id, user.id));
        const token = `${ADMIN_TOKEN_PREFIX}:${user.id}:${user.role}`;
        res.json({ success: true, token, role: user.role });
        return;
      }
    }

    res.status(401).json({ success: false, token: "", role: null });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid credentials format" });
  }
});

export default router;
