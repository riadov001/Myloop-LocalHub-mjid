import { Router, type Request } from "express";
import bcrypt from "bcryptjs";
import { db, adminUsersTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { rootAuth } from "../middleware/adminAuth";
import { recordAuditLog } from "../lib/auditLog.js";
import { z } from "zod/v4";

const router = Router();

const CreateAdminUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["root", "admin"]).default("admin"),
  isActive: z.boolean().default(true),
});

const UpdateAdminUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).optional(),
  password: z.string().min(6).optional(),
  role: z.enum(["root", "admin"]).optional(),
  isActive: z.boolean().optional(),
});

function serializeUser(u: typeof adminUsersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    isActive: u.isActive,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
  };
}

// GET /admin/users (root only) — never exposes root-role accounts
router.get("/admin/users", rootAuth, async (req, res) => {
  try {
    const users = await db
      .select()
      .from(adminUsersTable)
      .where(ne(adminUsersTable.role, "root"))
      .orderBy(adminUsersTable.createdAt);
    res.json(users.map(serializeUser));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des admins" });
  }
});

// POST /admin/users (root only)
router.post("/admin/users", rootAuth, async (req, res) => {
  try {
    const data = CreateAdminUserSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 12);
    const [created] = await db
      .insert(adminUsersTable)
      .values({ email: data.email, name: data.name, passwordHash, role: data.role, isActive: data.isActive })
      .returning();
    await recordAuditLog({
      req,
      action: "admins.create",
      targetType: "admin_user",
      targetId: created.id,
      summary: `Administrateur "${created.name}" (${created.email}) créé avec le rôle ${created.role}`,
    });
    res.status(201).json(serializeUser(created));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Erreur lors de la création de l'admin" });
  }
});

// PUT /admin/users/:id (root only)
router.put("/admin/users/:id", rootAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data = UpdateAdminUserSchema.parse(req.body);
    const updateData: Partial<typeof adminUsersTable.$inferInsert> = {};
    if (data.email) updateData.email = data.email;
    if (data.name) updateData.name = data.name;
    if (data.role) updateData.role = data.role;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);

    const [updated] = await db
      .update(adminUsersTable)
      .set(updateData)
      .where(eq(adminUsersTable.id, id))
      .returning();

    if (!updated) { res.status(404).json({ error: "Admin introuvable" }); return; }
    await recordAuditLog({
      req,
      action: "admins.update",
      targetType: "admin_user",
      targetId: updated.id,
      summary: `Administrateur "${updated.name}" (${updated.email}) modifié (${Object.keys(updateData).join(", ")})`,
      metadata: { changedFields: Object.keys(updateData) },
    });
    res.json(serializeUser(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Erreur lors de la mise à jour" });
  }
});

// DELETE /admin/users/:id (root only)
router.delete("/admin/users/:id", rootAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const r = req as Request & { adminPayload: { sub: string } };
    if (r.adminPayload.sub === String(id)) {
      res.status(400).json({ error: "Vous ne pouvez pas supprimer votre propre compte." });
      return;
    }
    await db.delete(adminUsersTable).where(eq(adminUsersTable.id, id));
    await recordAuditLog({
      req,
      action: "admins.delete",
      targetType: "admin_user",
      targetId: id,
      summary: `Administrateur #${id} supprimé`,
    });
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

export default router;
