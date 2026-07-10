import { Router } from "express";
import { db, brandingTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateBrandingBody } from "@workspace/api-zod";
import { adminAuth } from "../middleware/adminAuth";

const router = Router();

// GET /admin/branding — PROTECTED
router.get("/admin/branding", adminAuth, async (req, res) => {
  try {
    let [branding] = await db.select().from(brandingTable).limit(1);
    if (!branding) {
      // Create default branding if none exists
      [branding] = await db
        .insert(brandingTable)
        .values({
          primaryColor: "#2563eb",
          accentColor: "#1d4ed8",
          backgroundColor: "#ffffff",
          fontFamily: "Inter",
          siteName: "Grainily",
        })
        .returning();
    }
    res.json({
      logoUrl: branding.logoUrl ?? null,
      primaryColor: branding.primaryColor,
      accentColor: branding.accentColor,
      backgroundColor: branding.backgroundColor,
      fontFamily: branding.fontFamily,
      siteName: branding.siteName,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Branding unavailable" });
  }
});

// PUT /admin/branding — PROTECTED
router.put("/admin/branding", adminAuth, async (req, res) => {
  try {
    const body = UpdateBrandingBody.parse(req.body);
    let [existing] = await db.select().from(brandingTable).limit(1);

    if (existing) {
      const [updated] = await db
        .update(brandingTable)
        .set(body)
        .where(eq(brandingTable.id, existing.id))
        .returning();
      res.json({
        logoUrl: updated.logoUrl ?? null,
        primaryColor: updated.primaryColor,
        accentColor: updated.accentColor,
        backgroundColor: updated.backgroundColor,
        fontFamily: updated.fontFamily,
        siteName: updated.siteName,
      });
    } else {
      const [created] = await db.insert(brandingTable).values(body as any).returning();
      res.json({
        logoUrl: created.logoUrl ?? null,
        primaryColor: created.primaryColor,
        accentColor: created.accentColor,
        backgroundColor: created.backgroundColor,
        fontFamily: created.fontFamily,
        siteName: created.siteName,
      });
    }
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Invalid branding data" });
  }
});

export default router;
