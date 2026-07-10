import { Router } from "express";
import { db, adsTable, subscriptionsTable, plansTable, adViewsTable, usersTable } from "@workspace/db";
import { eq, and, count, desc, gte, inArray } from "drizzle-orm";
import { userAuth, type AuthRequest } from "../middleware/userAuth.js";
import { z } from "zod/v4";

const router = Router();

/** GET /merchant/me — profil utilisateur + abonnement actif */
router.get("/merchant/me", userAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) { res.status(404).json({ error: "Utilisateur introuvable." }); return; }

    const [sub] = await db.select({ sub: subscriptionsTable, plan: plansTable })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(eq(subscriptionsTable.userId, userId))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      subscription: sub ? {
        status: sub.sub.status,
        plan: sub.plan,
        currentPeriodEnd: sub.sub.currentPeriodEnd?.toISOString() ?? null,
        cancelAtPeriodEnd: sub.sub.cancelAtPeriodEnd,
      } : null,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** GET /merchant/ads — annonces de l'utilisateur connecté */
router.get("/merchant/ads", userAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const ads = await db.select().from(adsTable)
      .where(eq(adsTable.userId, userId))
      .orderBy(desc(adsTable.createdAt));

    // Vue count par annonce (via adViewsTable)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const viewCounts = ads.length > 0
      ? await db.select({ adId: adViewsTable.adId, views: count(adViewsTable.id) })
          .from(adViewsTable)
          .where(gte(adViewsTable.viewedAt, thirtyDaysAgo))
          .groupBy(adViewsTable.adId)
      : [];

    const viewMap = Object.fromEntries(viewCounts.map((v) => [v.adId, v.views]));
    const result = ads.map((ad) => ({ ...ad, views: viewMap[ad.id] ?? 0 }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** GET /merchant/stats — stats globales de l'utilisateur connecté */
router.get("/merchant/stats", userAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const [adCount] = await db.select({ total: count() }).from(adsTable).where(eq(adsTable.userId, userId));
    const [publishedCount] = await db.select({ total: count() }).from(adsTable)
      .where(and(eq(adsTable.userId, userId), eq(adsTable.status, "published")));
    const [pendingCount] = await db.select({ total: count() }).from(adsTable)
      .where(and(eq(adsTable.userId, userId), eq(adsTable.status, "pending")));

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const userAdIds = (await db.select({ id: adsTable.id }).from(adsTable).where(eq(adsTable.userId, userId))).map((a) => a.id);

    let totalViews30d = 0;
    if (userAdIds.length > 0) {
      const [viewRes] = await db.select({ total: count() }).from(adViewsTable)
        .where(and(inArray(adViewsTable.adId, userAdIds), gte(adViewsTable.viewedAt, thirtyDaysAgo)));
      totalViews30d = viewRes?.total ?? 0;
    }

    res.json({
      totalAds: adCount?.total ?? 0,
      publishedAds: publishedCount?.total ?? 0,
      pendingAds: pendingCount?.total ?? 0,
      totalViews30d,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** PUT /merchant/profile — mise à jour du nom */
router.put("/merchant/profile", userAuth, async (req: AuthRequest, res) => {
  try {
    const { name } = z.object({ name: z.string().min(1).max(100) }).parse(req.body);
    const [user] = await db.update(usersTable)
      .set({ name })
      .where(eq(usersTable.id, req.user!.id))
      .returning();
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

export default router;
