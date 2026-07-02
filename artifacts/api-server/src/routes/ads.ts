import { Router } from "express";
import { db, adsTable } from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import {
  ListAdsQueryParams,
  CreateAdBody,
  GetAdParams,
  AdminListAdsQueryParams,
  UpdateAdStatusParams,
  UpdateAdStatusBody,
  DeleteAdParams,
} from "@workspace/api-zod";
import { adminAuth } from "../middleware/adminAuth";
import { userAuth, requireRole, type AuthRequest } from "../middleware/userAuth.js";
import { z } from "zod/v4";

const BulkAdActionSchema = z.object({
  ids: z.array(z.number().int().positive()).min(1),
  action: z.enum(["publish", "reject", "delete"]),
});

const router = Router();

// GET /ads — list published ads with optional filters
router.get("/ads", async (req, res) => {
  try {
    const query = ListAdsQueryParams.parse(req.query);
    const conditions: ReturnType<typeof eq>[] = [eq(adsTable.status, "published")];

    const ads = await db
      .select()
      .from(adsTable)
      .where(and(...conditions))
      .orderBy(adsTable.createdAt)
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);

    let filtered = ads;
    if (query.location) {
      filtered = filtered.filter((a) =>
        a.location.toLowerCase().includes((query.location as string).toLowerCase())
      );
    }
    if (query.product) {
      filtered = filtered.filter((a) =>
        a.product.toLowerCase().includes((query.product as string).toLowerCase()) ||
        a.title.toLowerCase().includes((query.product as string).toLowerCase())
      );
    }
    if (query.category) {
      filtered = filtered.filter((a) =>
        a.category.toLowerCase() === (query.category as string).toLowerCase()
      );
    }
    if (query.unit) {
      filtered = filtered.filter((a) =>
        a.unit?.toLowerCase() === (query.unit as string).toLowerCase()
      );
    }
    if (query.quantity) {
      const q = (query.quantity as string).toLowerCase();
      filtered = filtered.filter((a) =>
        (a.quantity ?? "").toLowerCase().includes(q)
      );
    }
    if (query.listingType) {
      filtered = filtered.filter((a) =>
        a.listingType === (query.listingType as string)
      );
    }

    res.json(
      filtered.map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))
    );
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid query params" });
  }
});

// POST /ads — create a new ad (pending review) — réservé aux marchands connectés
router.post("/ads", userAuth, requireRole("merchant"), async (req: AuthRequest, res) => {
  try {
    const body = CreateAdBody.parse(req.body);
    const [ad] = await db
      .insert(adsTable)
      .values({
        userId: req.user?.id ?? null,
        title: body.title,
        description: body.description,
        location: body.location,
        product: body.product,
        quantity: body.quantity,
        unit: body.unit,
        category: body.category,
        listingType: (body.listingType as "free" | "flexible" | "fixed") ?? "flexible",
        price: body.price,
        isPromoted: body.isPromoted ?? false,
        promotionDuration: body.promotionDuration,
        promotionPrice: body.promotionPrice,
        contactPhone: body.contactPhone,
        contactEmail: body.contactEmail || null,
        status: "pending",
      })
      .returning();
    res.status(201).json({ ...ad, createdAt: ad.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid ad data" });
  }
});

// GET /ads/:id — get single ad
router.get("/ads/:id", async (req, res) => {
  try {
    const { id } = GetAdParams.parse(req.params);
    const [ad] = await db.select().from(adsTable).where(eq(adsTable.id, id));
    if (!ad) { res.status(404).json({ error: "Ad not found" }); return; }
    res.json({ ...ad, createdAt: ad.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid id" });
  }
});

// GET /admin/ads — list all ads (admin) — PROTECTED
router.get("/admin/ads", adminAuth, async (req, res) => {
  try {
    const query = AdminListAdsQueryParams.parse(req.query);
    const conditions = query.status
      ? [eq(adsTable.status, query.status as "pending" | "published" | "rejected")]
      : [];

    const ads = await db
      .select()
      .from(adsTable)
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(adsTable.createdAt);

    res.json(ads.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid query" });
  }
});

// PATCH /admin/ads/:id/status — update ad status — PROTECTED
router.patch("/admin/ads/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = UpdateAdStatusParams.parse(req.params);
    const { status } = UpdateAdStatusBody.parse(req.body);
    const [updated] = await db
      .update(adsTable)
      .set({ status })
      .where(eq(adsTable.id, id))
      .returning();
    if (!updated) { res.status(404).json({ error: "Ad not found" }); return; }
    res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid data" });
  }
});

// DELETE /admin/ads/:id — PROTECTED
router.delete("/admin/ads/:id", adminAuth, async (req, res) => {
  try {
    const { id } = DeleteAdParams.parse(req.params);
    await db.delete(adsTable).where(eq(adsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid id" });
  }
});

// POST /admin/ads/bulk — bulk approve / reject / delete — PROTECTED
router.post("/admin/ads/bulk", adminAuth, async (req, res) => {
  try {
    const { ids, action } = BulkAdActionSchema.parse(req.body);
    let affected = 0;
    if (action === "publish") {
      const rows = await db
        .update(adsTable)
        .set({ status: "published" })
        .where(inArray(adsTable.id, ids))
        .returning({ id: adsTable.id });
      affected = rows.length;
    } else if (action === "reject") {
      const rows = await db
        .update(adsTable)
        .set({ status: "rejected" })
        .where(inArray(adsTable.id, ids))
        .returning({ id: adsTable.id });
      affected = rows.length;
    } else if (action === "delete") {
      const rows = await db
        .delete(adsTable)
        .where(inArray(adsTable.id, ids))
        .returning({ id: adsTable.id });
      affected = rows.length;
    }
    res.json({ affected });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

export default router;
