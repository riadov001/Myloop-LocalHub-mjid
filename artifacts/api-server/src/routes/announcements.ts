import { Router } from "express";
import { db, announcementsTable } from "@workspace/db";
import { and, desc, eq, isNull, lte, gte, or } from "drizzle-orm";
import { rootAuth } from "../middleware/adminAuth";
import { recordAuditLog } from "../lib/auditLog.js";
import { z } from "zod/v4";

const router = Router();

const AnnouncementInputSchema = z.object({
  message: z.string().min(1).max(2000),
  style: z.enum(["info", "warning", "success"]).default("info"),
  isActive: z.boolean().default(false),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

function serialize(row: typeof announcementsTable.$inferSelect) {
  return {
    id: row.id,
    message: row.message,
    style: row.style,
    isActive: row.isActive,
    startsAt: row.startsAt ? row.startsAt.toISOString() : null,
    endsAt: row.endsAt ? row.endsAt.toISOString() : null,
    createdBy: row.createdBy,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// GET /admin/announcements — root/admin: list all announcements
router.get("/admin/announcements", rootAuth, async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(announcementsTable)
      .orderBy(desc(announcementsTable.createdAt));
    res.json(rows.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des annonces" });
  }
});

// POST /admin/announcements — root/admin: create a new announcement
router.post("/admin/announcements", rootAuth, async (req, res) => {
  try {
    const data = AnnouncementInputSchema.parse(req.body);
    const payload = (req as typeof req & { adminPayload?: { sub: string } }).adminPayload;

    const [created] = await db
      .insert(announcementsTable)
      .values({
        message: data.message,
        style: data.style,
        isActive: data.isActive,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        createdBy: payload?.sub ?? "root",
      })
      .returning();

    await recordAuditLog({
      req,
      action: "announcements.create",
      targetType: "announcement",
      targetId: created.id,
      summary: `Annonce créée : "${created.message.slice(0, 80)}"`,
      metadata: { style: created.style, isActive: created.isActive },
    });

    res.status(201).json(serialize(created));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

// PUT /admin/announcements/:id — root/admin: update an announcement
router.put("/admin/announcements/:id", rootAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Identifiant invalide" });
      return;
    }
    const data = AnnouncementInputSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(announcementsTable)
      .where(eq(announcementsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Annonce introuvable" });
      return;
    }

    const [updated] = await db
      .update(announcementsTable)
      .set({
        message: data.message,
        style: data.style,
        isActive: data.isActive,
        startsAt: data.startsAt ? new Date(data.startsAt) : null,
        endsAt: data.endsAt ? new Date(data.endsAt) : null,
        updatedAt: new Date(),
      })
      .where(eq(announcementsTable.id, id))
      .returning();

    await recordAuditLog({
      req,
      action: "announcements.update",
      targetType: "announcement",
      targetId: id,
      summary: `Annonce mise à jour : "${updated.message.slice(0, 80)}"`,
      metadata: { style: updated.style, isActive: updated.isActive },
    });

    res.json(serialize(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

// DELETE /admin/announcements/:id — root/admin: remove an announcement
router.delete("/admin/announcements/:id", rootAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: "Identifiant invalide" });
      return;
    }

    const [existing] = await db
      .select()
      .from(announcementsTable)
      .where(eq(announcementsTable.id, id));

    if (!existing) {
      res.status(404).json({ error: "Annonce introuvable" });
      return;
    }

    await db.delete(announcementsTable).where(eq(announcementsTable.id, id));

    await recordAuditLog({
      req,
      action: "announcements.delete",
      targetType: "announcement",
      targetId: id,
      summary: `Annonce supprimée : "${existing.message.slice(0, 80)}"`,
    });

    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression de l'annonce" });
  }
});

// GET /announcements/active — public: currently active announcement(s), respecting schedule
router.get("/announcements/active", async (req, res) => {
  try {
    const now = new Date();
    const rows = await db
      .select()
      .from(announcementsTable)
      .where(
        and(
          eq(announcementsTable.isActive, true),
          or(isNull(announcementsTable.startsAt), lte(announcementsTable.startsAt, now)),
          or(isNull(announcementsTable.endsAt), gte(announcementsTable.endsAt, now)),
        ),
      )
      .orderBy(desc(announcementsTable.createdAt));
    res.json(rows.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des annonces" });
  }
});

export default router;
