import { Router, Request } from "express";
import bcrypt from "bcryptjs";
import { db, adminUsersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { adminAuth, AdminJwtPayload } from "../middleware/adminAuth.js";
import { z } from "zod/v4";
import { ROOT_EMAIL } from "./admin.js";

const router = Router();

const UpdateAdminProfileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  phone: z.string().optional(),
});

type AdminReq = Request & { adminPayload: AdminJwtPayload };

function serializeProfile(user: typeof adminUsersTable.$inferSelect) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone ?? null,
    createdAt: user.createdAt.toISOString(),
    isRoot: false,
  };
}

// GET /admin/profile — get own profile
router.get("/admin/profile", adminAuth, async (req, res) => {
  const r = req as AdminReq;
  const { sub } = r.adminPayload;

  if (sub === "root") {
    res.json({
      id: null,
      name: "Administrateur racine",
      email: ROOT_EMAIL,
      role: "root",
      phone: null,
      createdAt: null,
      isRoot: true,
    });
    return;
  }

  try {
    const id = parseInt(sub, 10);
    const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.id, id)).limit(1);
    if (!user) { res.status(404).json({ error: "Administrateur introuvable" }); return; }
    res.json(serializeProfile(user));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /admin/profile — update own profile
router.put("/admin/profile", adminAuth, async (req, res) => {
  const r = req as AdminReq;
  const { sub } = r.adminPayload;

  if (sub === "root") {
    res.status(403).json({ error: "Les identifiants du compte racine doivent être modifiés via les variables d'environnement." });
    return;
  }

  try {
    const id = parseInt(sub, 10);
    const data = UpdateAdminProfileSchema.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (data.name) updateData.name = data.name;
    if (data.email) updateData.email = data.email;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "Aucune donnée à mettre à jour" });
      return;
    }

    const [updated] = await db.update(adminUsersTable)
      .set(updateData as Partial<typeof adminUsersTable.$inferInsert>)
      .where(eq(adminUsersTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Administrateur introuvable" }); return; }
    res.json(serializeProfile(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

export default router;
