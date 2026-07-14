import { Router } from "express";
import { db, platformConfigTable } from "@workspace/db";
import { eq, ne } from "drizzle-orm";
import { adminAuth } from "../middleware/adminAuth";
import { recordAuditLog } from "../lib/auditLog.js";
import { z } from "zod/v4";

const router = Router();

const MASK = "••••••••••••••••";

const UpdateConfigSchema = z.object({
  value: z.string(),
});

function maskConfig(row: typeof platformConfigTable.$inferSelect) {
  return {
    key: row.key,
    value: row.isSecret ? (row.value ? MASK : null) : row.value,
    isSecret: row.isSecret,
    label: row.label,
    description: row.description ?? null,
    configType: row.configType,
    group: row.group,
  };
}

const DEFAULT_CONFIG = [
  // Identité
  { key: "site_name", label: "Nom du site", description: "Nom affiché dans le titre et le footer", isSecret: false, configType: "string" as const, group: "identite" },
  { key: "site_tagline", label: "Accroche / Slogan", description: "Phrase d'accroche affichée sur la page d'accueil", isSecret: false, configType: "string" as const, group: "identite" },
  { key: "site_url", label: "URL du site", description: "URL publique de la plateforme (ex: https://grainily.com)", isSecret: false, configType: "string" as const, group: "identite" },
  { key: "contact_email", label: "Email de contact", description: "Email affiché pour le support / contact", isSecret: false, configType: "string" as const, group: "identite" },
  { key: "from_email", label: "Email expéditeur", description: "Adresse email utilisée pour les envois (ex: noreply@grainily.com)", isSecret: false, configType: "string" as const, group: "identite" },
  { key: "footer_address", label: "Adresse (footer)", description: "Adresse physique ou région affichée dans le pied de page", isSecret: false, configType: "string" as const, group: "identite" },
  // SEO
  { key: "seo_title", label: "Titre SEO", description: "Titre de la page pour les moteurs de recherche (<title>)", isSecret: false, configType: "string" as const, group: "seo" },
  { key: "seo_description", label: "Meta Description SEO", description: "Description courte pour Google (150-160 caractères recommandés)", isSecret: false, configType: "string" as const, group: "seo" },
  { key: "seo_keywords", label: "Mots-clés SEO", description: "Mots-clés séparés par des virgules", isSecret: false, configType: "string" as const, group: "seo" },
  { key: "og_image_url", label: "Image Open Graph", description: "URL de l'image partagée sur les réseaux sociaux (1200x630 px)", isSecret: false, configType: "string" as const, group: "seo" },
  // Réseaux sociaux
  { key: "facebook_url", label: "Facebook", description: "URL complète de la page Facebook", isSecret: false, configType: "string" as const, group: "socials" },
  { key: "instagram_url", label: "Instagram", description: "URL du profil Instagram", isSecret: false, configType: "string" as const, group: "socials" },
  { key: "twitter_url", label: "Twitter / X", description: "URL du profil Twitter/X", isSecret: false, configType: "string" as const, group: "socials" },
  { key: "whatsapp_number", label: "WhatsApp", description: "Numéro WhatsApp au format international (ex: +33612345678)", isSecret: false, configType: "string" as const, group: "socials" },
  { key: "youtube_url", label: "YouTube", description: "URL de la chaîne YouTube", isSecret: false, configType: "string" as const, group: "socials" },
  // Maintenance
  { key: "maintenance_message", label: "Message de maintenance", description: "Texte affiché aux visiteurs quand le mode maintenance est actif", isSecret: false, configType: "string" as const, group: "maintenance" },
  // Intégrations
  { key: "stripe_api_key", label: "Clé API Stripe", description: "Clé secrète Stripe (sk_...)", isSecret: true, configType: "secret" as const, group: "integrations" },
  { key: "stripe_webhook_secret", label: "Secret Webhook Stripe", description: "Secret de validation des webhooks Stripe (whsec_...)", isSecret: true, configType: "secret" as const, group: "integrations" },
  { key: "resend_api_key", label: "Clé API Resend", description: "Clé API pour l'envoi d'emails via Resend", isSecret: true, configType: "secret" as const, group: "integrations" },
  { key: "google_analytics_id", label: "Google Analytics ID", description: "Identifiant de suivi Google Analytics (ex: G-XXXXXXXXXX)", isSecret: false, configType: "string" as const, group: "integrations" },
];

async function ensureDefaults() {
  const existing = await db.select({ key: platformConfigTable.key }).from(platformConfigTable);
  const existingKeys = new Set(existing.map(r => r.key));
  const toInsert = DEFAULT_CONFIG.filter(c => !existingKeys.has(c.key));
  if (toInsert.length > 0) {
    await db.insert(platformConfigTable).values(
      toInsert.map(c => ({ key: c.key, label: c.label, description: c.description, isSecret: c.isSecret, configType: c.configType, group: c.group, value: null }))
    );
  }
}

// GET /admin/config — returns non-mode configs only
router.get("/admin/config", adminAuth, async (req, res) => {
  try {
    await ensureDefaults();
    const rows = await db
      .select()
      .from(platformConfigTable)
      .where(ne(platformConfigTable.group, "modes"))
      .orderBy(platformConfigTable.key);
    res.json(rows.map(maskConfig));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la récupération de la configuration" });
  }
});

// PUT /admin/config/:key
router.put("/admin/config/:key", adminAuth, async (req, res) => {
  try {
    const key: string = req.params.key as string;
    const { value } = UpdateConfigSchema.parse(req.body);

    const [existing] = await db
      .select()
      .from(platformConfigTable)
      .where(eq(platformConfigTable.key, key));

    if (!existing) {
      res.status(404).json({ error: "Clé de configuration introuvable" });
      return;
    }

    const newValue = (existing.isSecret && value === MASK) ? existing.value : value;

    const [updated] = await db
      .update(platformConfigTable)
      .set({ value: newValue })
      .where(eq(platformConfigTable.key, key))
      .returning();

    await recordAuditLog({
      req,
      action: "config.update",
      targetType: "platform_config",
      targetId: key,
      summary: existing.isSecret
        ? `Configuration "${existing.label}" mise à jour (valeur secrète masquée)`
        : `Configuration "${existing.label}" mise à jour`,
      metadata: existing.isSecret ? undefined : { value: newValue },
    });

    res.json(maskConfig(updated));
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides" });
  }
});

export default router;
