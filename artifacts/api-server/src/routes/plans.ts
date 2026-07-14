import { Router } from "express";
import { db, plansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { adminAuth } from "../middleware/adminAuth";
import { recordAuditLog } from "../lib/auditLog.js";
import { z } from "zod/v4";

const router = Router();

const PlanInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  priceMonthly: z.string().default("0"),
  priceAnnual: z.string().optional(),
  maxAds: z.number().int().optional(),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

function serializePlan(p: typeof plansTable.$inferSelect) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description ?? null,
    priceMonthly: p.priceMonthly,
    priceAnnual: p.priceAnnual ?? null,
    maxAds: p.maxAds ?? null,
    features: (() => {
      try { return JSON.parse(p.features); } catch { return []; }
    })(),
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  };
}

// GET /plans (public — active only)
router.get("/plans", async (req, res) => {
  try {
    const plans = await db.select().from(plansTable).orderBy(plansTable.sortOrder);
    res.json(plans.filter(p => p.isActive).map(serializePlan));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des plans" });
  }
});

// GET /admin/plans
router.get("/admin/plans", adminAuth, async (req, res) => {
  try {
    const plans = await db.select().from(plansTable).orderBy(plansTable.sortOrder);
    res.json(plans.map(serializePlan));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des plans" });
  }
});

// POST /admin/plans
router.post("/admin/plans", adminAuth, async (req, res) => {
  try {
    const body = PlanInputSchema.parse(req.body);
    const [plan] = await db
      .insert(plansTable)
      .values({ ...body, features: JSON.stringify(body.features) })
      .returning();
    await recordAuditLog({
      req,
      action: "plans.create",
      targetType: "plan",
      targetId: plan.id,
      summary: `Plan "${plan.name}" créé`,
    });
    res.status(201).json(serializePlan(plan));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données de plan invalides" });
  }
});

// PUT /admin/plans/:id
router.put("/admin/plans/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const body = PlanInputSchema.parse(req.body);
    const [plan] = await db
      .update(plansTable)
      .set({ ...body, features: JSON.stringify(body.features) })
      .where(eq(plansTable.id, id))
      .returning();
    if (!plan) { res.status(404).json({ error: "Plan introuvable" }); return; }
    await recordAuditLog({
      req,
      action: "plans.update",
      targetType: "plan",
      targetId: plan.id,
      summary: `Plan "${plan.name}" modifié`,
    });
    res.json(serializePlan(plan));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données de plan invalides" });
  }
});

// DELETE /admin/plans/:id
router.delete("/admin/plans/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(plansTable).where(eq(plansTable.id, id));
    await recordAuditLog({
      req,
      action: "plans.delete",
      targetType: "plan",
      targetId: id,
      summary: `Plan #${id} supprimé`,
    });
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

export default router;
