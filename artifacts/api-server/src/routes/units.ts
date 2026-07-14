import { Router } from "express";
import { db, unitsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { adminAuth } from "../middleware/adminAuth";
import { recordAuditLog } from "../lib/auditLog.js";
import { z } from "zod";

const router = Router();

const unitInputSchema = z.object({
  name: z.string().min(1),
  symbol: z.string().min(1),
  active: z.boolean().optional().default(true),
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

// GET /units — public: list active units
router.get("/units", async (req, res) => {
  try {
    const units = await db
      .select()
      .from(unitsTable)
      .where(eq(unitsTable.active, true))
      .orderBy(unitsTable.name);
    res.json(units);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/units — admin: list all
router.get("/admin/units", adminAuth, async (req, res) => {
  try {
    const units = await db.select().from(unitsTable).orderBy(unitsTable.name);
    res.json(units);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /admin/units — admin: create
router.post("/admin/units", adminAuth, async (req, res) => {
  try {
    const body = unitInputSchema.parse(req.body);
    const [unit] = await db.insert(unitsTable).values(body).returning();
    await recordAuditLog({
      req,
      action: "units.create",
      targetType: "unit",
      targetId: unit.id,
      summary: `Unité "${unit.name}" créée`,
    });
    res.status(201).json(unit);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

// PUT /admin/units/:id — admin: update
router.put("/admin/units/:id", adminAuth, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const body = unitInputSchema.parse(req.body);
    const [unit] = await db.update(unitsTable).set(body).where(eq(unitsTable.id, id)).returning();
    if (!unit) { res.status(404).json({ error: "Unité introuvable" }); return; }
    await recordAuditLog({
      req,
      action: "units.update",
      targetType: "unit",
      targetId: unit.id,
      summary: `Unité "${unit.name}" modifiée`,
    });
    res.json(unit);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

// DELETE /admin/units/:id — admin: delete
router.delete("/admin/units/:id", adminAuth, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await db.delete(unitsTable).where(eq(unitsTable.id, id));
    await recordAuditLog({
      req,
      action: "units.delete",
      targetType: "unit",
      targetId: id,
      summary: `Unité #${id} supprimée`,
    });
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Erreur suppression" });
  }
});

export default router;
