import { Router } from "express";
import { db, categoriesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { adminAuth } from "../middleware/adminAuth";
import { recordAuditLog } from "../lib/auditLog.js";
import { z } from "zod";

const router = Router();

const categoryInputSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  active: z.boolean().optional().default(true),
});

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

// GET /categories — public: list active categories
router.get("/categories", async (req, res) => {
  try {
    const cats = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.active, true))
      .orderBy(categoriesTable.name);
    res.json(cats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /admin/categories — admin: list all
router.get("/admin/categories", adminAuth, async (req, res) => {
  try {
    const cats = await db.select().from(categoriesTable).orderBy(categoriesTable.name);
    res.json(cats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /admin/categories — admin: create
router.post("/admin/categories", adminAuth, async (req, res) => {
  try {
    const body = categoryInputSchema.parse(req.body);
    const [cat] = await db.insert(categoriesTable).values(body).returning();
    await recordAuditLog({
      req,
      action: "categories.create",
      targetType: "category",
      targetId: cat.id,
      summary: `Catégorie "${cat.name}" créée`,
    });
    res.status(201).json(cat);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

// PUT /admin/categories/:id — admin: update
router.put("/admin/categories/:id", adminAuth, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    const body = categoryInputSchema.parse(req.body);
    const [cat] = await db.update(categoriesTable).set(body).where(eq(categoriesTable.id, id)).returning();
    if (!cat) { res.status(404).json({ error: "Catégorie introuvable" }); return; }
    await recordAuditLog({
      req,
      action: "categories.update",
      targetType: "category",
      targetId: cat.id,
      summary: `Catégorie "${cat.name}" modifiée`,
    });
    res.json(cat);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

// DELETE /admin/categories/:id — admin: delete
router.delete("/admin/categories/:id", adminAuth, async (req, res) => {
  try {
    const { id } = idParamSchema.parse(req.params);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    await recordAuditLog({
      req,
      action: "categories.delete",
      targetType: "category",
      targetId: id,
      summary: `Catégorie #${id} supprimée`,
    });
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Erreur suppression" });
  }
});

export default router;
