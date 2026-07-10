import { Router } from "express";
import { db, subscriptionsTable, donationsTable, usersTable, plansTable } from "@workspace/db";
import { eq, desc, count, sum } from "drizzle-orm";
import { adminAuth } from "../middleware/adminAuth.js";
import { z } from "zod/v4";

const router = Router();

// ── Abonnements ──────────────────────────────────────────────

/** GET /admin/payments/subscriptions — liste tous les abonnements */
router.get("/admin/payments/subscriptions", adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Number(req.query.limit ?? 20));
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: subscriptionsTable.id,
        status: subscriptionsTable.status,
        stripeSubscriptionId: subscriptionsTable.stripeSubscriptionId,
        stripeCustomerId: subscriptionsTable.stripeCustomerId,
        cancelAtPeriodEnd: subscriptionsTable.cancelAtPeriodEnd,
        currentPeriodEnd: subscriptionsTable.currentPeriodEnd,
        createdAt: subscriptionsTable.createdAt,
        updatedAt: subscriptionsTable.updatedAt,
        userId: subscriptionsTable.userId,
        planId: subscriptionsTable.planId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        planName: plansTable.name,
        planSlug: plansTable.slug,
        priceMonthly: plansTable.priceMonthly,
      })
      .from(subscriptionsTable)
      .leftJoin(usersTable, eq(subscriptionsTable.userId, usersTable.id))
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(subscriptionsTable);

    res.json({ rows, total, page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** GET /admin/payments/subscriptions/stats — stats abonnements */
router.get("/admin/payments/subscriptions/stats", adminAuth, async (req, res) => {
  try {
    const [total] = await db.select({ count: count() }).from(subscriptionsTable);
    const [active] = await db.select({ count: count() }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "active"));
    const [cancelled] = await db.select({ count: count() }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "cancelled"));
    const [pastDue] = await db.select({ count: count() }).from(subscriptionsTable).where(eq(subscriptionsTable.status, "past_due"));
    res.json({
      total: total?.count ?? 0,
      active: active?.count ?? 0,
      cancelled: cancelled?.count ?? 0,
      pastDue: pastDue?.count ?? 0,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** PATCH /admin/payments/subscriptions/:id — modifier statut abonnement */
router.patch("/admin/payments/subscriptions/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = z.object({
      status: z.enum(["active", "cancelled", "past_due", "trialing", "expired", "pending"]),
    }).parse(req.body);

    const [sub] = await db.update(subscriptionsTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(subscriptionsTable.id, id))
      .returning();

    if (!sub) { res.status(404).json({ error: "Abonnement introuvable." }); return; }
    res.json(sub);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

/** DELETE /admin/payments/subscriptions/:id — supprimer abonnement en DB */
router.delete("/admin/payments/subscriptions/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(subscriptionsTable).where(eq(subscriptionsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

// ── Dons ─────────────────────────────────────────────────────

/** GET /admin/payments/donations — liste tous les dons */
router.get("/admin/payments/donations", adminAuth, async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Number(req.query.limit ?? 20));
    const offset = (page - 1) * limit;

    const rows = await db
      .select({
        id: donationsTable.id,
        amount: donationsTable.amount,
        currency: donationsTable.currency,
        donorName: donationsTable.donorName,
        donorEmail: donationsTable.donorEmail,
        status: donationsTable.status,
        stripeSessionId: donationsTable.stripeSessionId,
        stripePaymentIntentId: donationsTable.stripePaymentIntentId,
        createdAt: donationsTable.createdAt,
        userId: donationsTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
      })
      .from(donationsTable)
      .leftJoin(usersTable, eq(donationsTable.userId, usersTable.id))
      .orderBy(desc(donationsTable.createdAt))
      .limit(limit)
      .offset(offset);

    const [{ total }] = await db.select({ total: count() }).from(donationsTable);
    const [{ totalCompleted }] = await db.select({
      totalCompleted: sum(donationsTable.amount),
    }).from(donationsTable).where(eq(donationsTable.status, "completed"));

    res.json({ rows, total, totalCompleted: Number(totalCompleted ?? 0), page, limit });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** PATCH /admin/payments/donations/:id — modifier statut don */
router.patch("/admin/payments/donations/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status } = z.object({
      status: z.enum(["pending", "completed", "failed", "refunded"]),
    }).parse(req.body);
    const [don] = await db.update(donationsTable)
      .set({ status })
      .where(eq(donationsTable.id, id))
      .returning();
    if (!don) { res.status(404).json({ error: "Don introuvable." }); return; }
    res.json(don);
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Données invalides." });
  }
});

/** DELETE /admin/payments/donations/:id — supprimer don en DB */
router.delete("/admin/payments/donations/:id", adminAuth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(donationsTable).where(eq(donationsTable.id, id));
    res.status(204).end();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

export default router;
