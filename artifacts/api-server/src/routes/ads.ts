import { Router } from "express";
import { db, adsTable } from "@workspace/db";
import { eq, and, inArray, ilike, sql, asc, desc } from "drizzle-orm";
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
    // Toutes les conditions sont appliquées au niveau SQL afin que limit/offset paginent
    // correctement sur le jeu de résultats déjà filtré (et non sur les 50 premières lignes brutes).
    const conditions = [eq(adsTable.status, "published")];
    if (query.location) conditions.push(ilike(adsTable.location, `%${query.location}%`));
    if (query.product) {
      conditions.push(
        sql`(${ilike(adsTable.product, `%${query.product}%`)} or ${ilike(adsTable.title, `%${query.product}%`)})`
      );
    }
    if (query.category) conditions.push(eq(adsTable.category, query.category));
    if (query.unit) conditions.push(eq(adsTable.unit, query.unit));
    if (query.quantity) conditions.push(ilike(adsTable.quantity, `%${query.quantity}%`));
    if (query.listingType) {
      conditions.push(eq(adsTable.listingType, query.listingType as "free" | "flexible" | "fixed"));
    }

    const sortBy = (req.query.sortBy as string) || "newest";
    const orderClause =
      sortBy === "oldest"
        ? asc(adsTable.createdAt)
        : sortBy === "price_asc"
          ? asc(sql`CAST(${adsTable.price} AS NUMERIC)`)
          : sortBy === "price_desc"
            ? desc(sql`CAST(${adsTable.price} AS NUMERIC)`)
            : desc(adsTable.createdAt);

    const ads = await db
      .select()
      .from(adsTable)
      .where(and(...conditions))
      .orderBy(orderClause)
      .limit(query.limit ?? 50)
      .offset(query.offset ?? 0);

    res.json(
      ads.map((a) => ({
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
        userId: req.user!.id,
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
