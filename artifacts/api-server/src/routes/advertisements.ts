import { Router } from "express";
import { db, advertisementsTable } from "@workspace/db";
import { eq, and, or, lte, gte, isNull, asc, inArray, sql } from "drizzle-orm";
import {
  AdminCreateAdvertisementBody,
  AdminUpdateAdvertisementParams,
  AdminUpdateAdvertisementBody,
  AdminDeleteAdvertisementParams,
  AdminReorderAdvertisementsBody,
} from "@workspace/api-zod";
import { adminAuth } from "../middleware/adminAuth";
import { recordAuditLog } from "../lib/auditLog.js";

const router = Router();

function serialize(a: typeof advertisementsTable.$inferSelect) {
  return {
    ...a,
    startDate: a.startDate ? a.startDate.toISOString() : null,
    endDate: a.endDate ? a.endDate.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  };
}

// GET /advertisements — list active advertisements within date range (public)
router.get("/advertisements", async (req, res) => {
  try {
    const now = new Date();
    const ads = await db
      .select()
      .from(advertisementsTable)
      .where(
        and(
          eq(advertisementsTable.isActive, true),
          or(isNull(advertisementsTable.startDate), lte(advertisementsTable.startDate, now)),
          or(isNull(advertisementsTable.endDate), gte(advertisementsTable.endDate, now))
        )
      )
      .orderBy(asc(advertisementsTable.displayOrder), asc(advertisementsTable.createdAt));

    res.json(ads.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Advertisements unavailable" });
  }
});

// GET /admin/advertisements — list all advertisements — PROTECTED
router.get("/admin/advertisements", adminAuth, async (req, res) => {
  try {
    const ads = await db
      .select()
      .from(advertisementsTable)
      .orderBy(asc(advertisementsTable.displayOrder), asc(advertisementsTable.createdAt));
    res.json(ads.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Advertisements unavailable" });
  }
});

// POST /admin/advertisements — create advertisement — PROTECTED
router.post("/admin/advertisements", adminAuth, async (req, res) => {
  try {
    const body = AdminCreateAdvertisementBody.parse(req.body);

    let displayOrder = body.displayOrder;
    if (displayOrder === undefined) {
      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`coalesce(max(${advertisementsTable.displayOrder}), -1)` })
        .from(advertisementsTable);
      displayOrder = (maxOrder ?? -1) + 1;
    }

    const [created] = await db
      .insert(advertisementsTable)
      .values({
        title: body.title,
        mediaType: body.mediaType,
        mediaUrl: body.mediaUrl,
        linkUrl: body.linkUrl || null,
        displayOrder,
        isActive: body.isActive ?? true,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      })
      .returning();
    await recordAuditLog({
      req,
      action: "advertisements.create",
      targetType: "advertisement",
      targetId: created.id,
      summary: `Publicité "${created.title}" créée`,
    });
    res.status(201).json(serialize(created));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid advertisement data" });
  }
});

// POST /admin/advertisements/reorder — reorder advertisements — PROTECTED
router.post("/admin/advertisements/reorder", adminAuth, async (req, res) => {
  try {
    const { ids } = AdminReorderAdvertisementsBody.parse(req.body);

    await Promise.all(
      ids.map((id, index) =>
        db.update(advertisementsTable).set({ displayOrder: index }).where(eq(advertisementsTable.id, id))
      )
    );

    const ads = await db
      .select()
      .from(advertisementsTable)
      .where(inArray(advertisementsTable.id, ids))
      .orderBy(asc(advertisementsTable.displayOrder));
    await recordAuditLog({
      req,
      action: "advertisements.reorder",
      targetType: "advertisement",
      summary: `Ordre des publicités mis à jour (${ids.length} élément(s))`,
      metadata: { ids },
    });
    res.json(ads.map(serialize));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid reorder data" });
  }
});

// PUT /admin/advertisements/:id — update advertisement — PROTECTED
router.put("/admin/advertisements/:id", adminAuth, async (req, res) => {
  try {
    const { id } = AdminUpdateAdvertisementParams.parse(req.params);
    const body = AdminUpdateAdvertisementBody.parse(req.body);

    const [updated] = await db
      .update(advertisementsTable)
      .set({
        title: body.title,
        mediaType: body.mediaType,
        mediaUrl: body.mediaUrl,
        linkUrl: body.linkUrl || null,
        ...(body.displayOrder !== undefined ? { displayOrder: body.displayOrder } : {}),
        ...(body.isActive !== undefined ? { isActive: body.isActive } : {}),
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      })
      .where(eq(advertisementsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Advertisement not found" }); return; }
    await recordAuditLog({
      req,
      action: "advertisements.update",
      targetType: "advertisement",
      targetId: updated.id,
      summary: `Publicité "${updated.title}" modifiée`,
    });
    res.json(serialize(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid advertisement data" });
  }
});

// DELETE /admin/advertisements/:id — PROTECTED
router.delete("/admin/advertisements/:id", adminAuth, async (req, res) => {
  try {
    const { id } = AdminDeleteAdvertisementParams.parse(req.params);
    await db.delete(advertisementsTable).where(eq(advertisementsTable.id, id));
    await recordAuditLog({
      req,
      action: "advertisements.delete",
      targetType: "advertisement",
      targetId: id,
      summary: `Publicité #${id} supprimée`,
    });
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid id" });
  }
});

export default router;
