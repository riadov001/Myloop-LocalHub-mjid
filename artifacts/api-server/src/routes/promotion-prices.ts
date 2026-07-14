import { Router } from "express";
import { db, promotionPricesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { adminAuth } from "../middleware/adminAuth";
import { recordAuditLog } from "../lib/auditLog.js";
import { z } from "zod";

const router = Router();

// GET /promotion-prices — public: list active promotion prices
router.get("/promotion-prices", async (req, res) => {
  try {
    const prices = await db
      .select()
      .from(promotionPricesTable)
      .where(eq(promotionPricesTable.active, true))
      .orderBy(promotionPricesTable.duration);
    res.json(prices);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

const promotionPriceInputSchema = z.object({
  duration: z.number().int().positive(),
  label: z.string().min(1),
  price: z.string().min(1),
  active: z.boolean().optional().default(true),
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

// GET /admin/promotion-prices — admin: list all
router.get("/admin/promotion-prices", adminAuth, async (req, res) => {
  try {
    const prices = await db
      .select()
      .from(promotionPricesTable)
      .orderBy(promotionPricesTable.duration);
    res.json(prices);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /admin/promotion-prices — admin: create
router.post("/admin/promotion-prices", adminAuth, async (req, res) => {
  try {
    const body = promotionPriceInputSchema.parse(req.body);
    const [price] = await db.insert(promotionPricesTable).values(body).returning();
    await recordAuditLog({
      req,
      action: "promotion_prices.create",
      targetType: "promotion_price",
      targetId: price.id,
      summary: `Tarif de promotion "${price.label}" créé`,
    });
    res.status(201).json(price);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

// PUT /admin/promotion-prices/:id — admin: update
router.put("/admin/promotion-prices/:id", adminAuth, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const body = promotionPriceInputSchema.parse(req.body);
    const [price] = await db
      .update(promotionPricesTable)
      .set(body)
      .where(eq(promotionPricesTable.id, id))
      .returning();
    if (!price) { res.status(404).json({ error: "Tarif introuvable" }); return; }
    await recordAuditLog({
      req,
      action: "promotion_prices.update",
      targetType: "promotion_price",
      targetId: price.id,
      summary: `Tarif de promotion "${price.label}" modifié`,
    });
    res.json(price);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

// DELETE /admin/promotion-prices/:id — admin: delete
router.delete("/admin/promotion-prices/:id", adminAuth, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await db.delete(promotionPricesTable).where(eq(promotionPricesTable.id, id));
    await recordAuditLog({
      req,
      action: "promotion_prices.delete",
      targetType: "promotion_price",
      targetId: id,
      summary: `Tarif de promotion #${id} supprimé`,
    });
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Erreur suppression" });
  }
});

export default router;
