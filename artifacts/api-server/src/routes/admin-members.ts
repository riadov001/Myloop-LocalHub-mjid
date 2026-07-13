import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or, and } from "drizzle-orm";
import { adminAuth, rootAuth } from "../middleware/adminAuth.js";
import { JWT_SECRET } from "../lib/jwtSecret.js";
import { z } from "zod/v4";

const router = Router();

const CreateMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  role: z.enum(["customer", "merchant", "moderator"]).default("customer"),
  phone: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

const UpdateMemberSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["customer", "merchant", "moderator"]).optional(),
  phone: z.string().optional(),
  emailVerified: z.boolean().optional(),
});

function serializeMember(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone ?? null,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt.toISOString(),
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    isSuspended: u.isSuspended,
  };
}

// GET /admin/members
router.get("/admin/members", adminAuth, async (req, res) => {
  try {
    const roleFilter = req.query.role as string | undefined;
    const search = req.query.search as string | undefined;

    let rows = await db.select().from(usersTable).orderBy(usersTable.createdAt);

    if (roleFilter && ["customer", "merchant", "moderator"].includes(roleFilter)) {
      rows = rows.filter(u => u.role === roleFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }

    res.json(rows.map(serializeMember));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des membres" });
  }
});

// POST /admin/members
router.post("/admin/members", adminAuth, async (req, res) => {
  try {
    const data = CreateMemberSchema.parse(req.body);
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, data.email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Cette adresse email est déjà utilisée." });
      return;
    }
    const password = data.password ?? crypto.randomBytes(16).toString("hex");
    const passwordHash = await bcrypt.hash(password, 12);
    const [created] = await db.insert(usersTable).values({
      name: data.name,
      email: data.email,
      passwordHash,
      role: data.role,
      emailVerified: data.emailVerified ?? false,
    }).returning();
    res.status(201).json(serializeMember(created));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Erreur lors de la création du membre" });
  }
});

// PUT /admin/members/:id
router.put("/admin/members/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const data = UpdateMemberSchema.parse(req.body);
    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.emailVerified !== undefined) updateData.emailVerified = data.emailVerified;
    if (data.password) updateData.passwordHash = await bcrypt.hash(data.password, 12);

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: "Aucune donnée à mettre à jour" });
      return;
    }

    const [updated] = await db.update(usersTable)
      .set(updateData as Partial<typeof usersTable.$inferInsert>)
      .where(eq(usersTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Membre introuvable" }); return; }
    res.json(serializeMember(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Erreur lors de la mise à jour du membre" });
  }
});

// DELETE /admin/members/:id
router.delete("/admin/members/:id", adminAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// PATCH /admin/members/:id/suspend — root only : bloque immédiatement le compte (login + sessions actives)
router.patch("/admin/members/:id/suspend", rootAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const [updated] = await db.update(usersTable)
      .set({ isSuspended: true })
      .where(eq(usersTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Membre introuvable" }); return; }
    res.json(serializeMember(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la suspension" });
  }
});

// PATCH /admin/members/:id/unsuspend — root only : réactive le compte
router.patch("/admin/members/:id/unsuspend", rootAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const [updated] = await db.update(usersTable)
      .set({ isSuspended: false })
      .where(eq(usersTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Membre introuvable" }); return; }
    res.json(serializeMember(updated));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la réactivation" });
  }
});

// POST /admin/members/:id/impersonate — root only : émet un jeton utilisateur pour se connecter en tant que ce membre
router.post("/admin/members/:id/impersonate", rootAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    if (!user) { res.status(404).json({ error: "Membre introuvable" }); return; }
    if (user.isSuspended) { res.status(400).json({ error: "Impossible d'usurper un compte suspendu." }); return; }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role, impersonatedByRoot: true },
      JWT_SECRET,
      { expiresIn: "2h" },
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la connexion en tant qu'utilisateur" });
  }
});

export default router;
