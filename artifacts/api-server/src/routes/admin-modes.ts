import { Router } from "express";
import { db, platformConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { adminAuth } from "../middleware/adminAuth";
import { recordAuditLog } from "../lib/auditLog.js";
import { z } from "zod/v4";

const router = Router();

const DEFAULT_MODES = [
  { key: "maintenance_mode", label: "Mode maintenance", description: "Affiche une page de maintenance aux visiteurs", value: "false", group: "modes" },
  { key: "registration_enabled", label: "Inscriptions ouvertes", description: "Permet aux nouveaux utilisateurs de créer un compte", value: "true", group: "modes" },
  { key: "auto_approve_ads", label: "Approbation automatique des annonces", description: "Publie automatiquement les nouvelles annonces sans validation admin", value: "false", group: "modes" },
  { key: "show_contact_email", label: "Afficher l'email de contact", description: "Affiche l'email de contact sur les annonces", value: "true", group: "modes" },
  { key: "allow_donations", label: "Activer les dons", description: "Affiche le bouton et la page de dons", value: "true", group: "modes" },
];

async function ensureModeDefaults() {
  const existing = await db.select({ key: platformConfigTable.key }).from(platformConfigTable);
  const existingKeys = new Set(existing.map(r => r.key));
  const toInsert = DEFAULT_MODES.filter(m => !existingKeys.has(m.key));
  if (toInsert.length > 0) {
    await db.insert(platformConfigTable).values(
      toInsert.map(m => ({
        key: m.key,
        label: m.label,
        description: m.description,
        value: m.value,
        isSecret: false,
        configType: "boolean" as const,
        group: m.group,
      }))
    );
  }
}

function rowToMode(row: typeof platformConfigTable.$inferSelect) {
  return {
    key: row.key,
    label: row.label,
    description: row.description ?? null,
    enabled: row.value === "true",
  };
}

// GET /admin/modes
router.get("/admin/modes", adminAuth, async (req, res) => {
  try {
    await ensureModeDefaults();
    const rows = await db
      .select()
      .from(platformConfigTable)
      .where(eq(platformConfigTable.group, "modes"))
      .orderBy(platformConfigTable.key);
    res.json(rows.map(rowToMode));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération des modes" });
  }
});

// PUT /admin/modes/:key
router.put("/admin/modes/:key", adminAuth, async (req, res) => {
  try {
    const key = req.params.key as string;
    const { enabled } = z.object({ enabled: z.boolean() }).parse(req.body);

    const [row] = await db
      .select()
      .from(platformConfigTable)
      .where(eq(platformConfigTable.key, key));

    if (!row || row.group !== "modes") {
      res.status(404).json({ error: "Mode introuvable" });
      return;
    }

    const [updated] = await db
      .update(platformConfigTable)
      .set({ value: enabled ? "true" : "false" })
      .where(eq(platformConfigTable.key, key))
      .returning();

    await recordAuditLog({
      req,
      action: "modes.update",
      targetType: "platform_config",
      targetId: key,
      summary: `Mode "${row.label}" ${enabled ? "activé" : "désactivé"}`,
      metadata: { key, enabled },
    });

    res.json(rowToMode(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

export default router;
