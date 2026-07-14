import { Router } from "express";
import { db, usersTable, adsTable, subscriptionsTable, donationsTable, plansTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { adminAuth } from "../middleware/adminAuth.js";
import { recordAuditLog } from "../lib/auditLog.js";
import { toCsv, sendCsv } from "../lib/csv.js";

const router = Router();

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

/** GET /admin/export/users — export CSV de tous les utilisateurs */
router.get("/admin/export/users", adminAuth, async (req, res) => {
  try {
    const rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    const csv = toCsv(
      rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone ?? "",
        emailVerified: u.emailVerified,
        isSuspended: u.isSuspended,
        createdAt: u.createdAt.toISOString(),
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : "",
      })),
      ["id", "name", "email", "role", "phone", "emailVerified", "isSuspended", "createdAt", "lastLoginAt"],
    );
    await recordAuditLog({
      req, action: "exports.users", targetType: "export",
      summary: `Export CSV des utilisateurs (${rows.length} ligne(s))`,
    });
    sendCsv(res, `utilisateurs-${dateStamp()}.csv`, csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de l'export." });
  }
});

/** GET /admin/export/ads — export CSV de toutes les annonces */
router.get("/admin/export/ads", adminAuth, async (req, res) => {
  try {
    const rows = await db.select().from(adsTable).orderBy(desc(adsTable.createdAt));
    const csv = toCsv(
      rows.map((a) => ({
        id: a.id,
        userId: a.userId ?? "",
        title: a.title,
        category: a.category,
        location: a.location,
        product: a.product,
        quantity: a.quantity ?? "",
        unit: a.unit ?? "",
        listingType: a.listingType,
        price: a.price ?? "",
        status: a.status,
        isPromoted: a.isPromoted,
        contactPhone: a.contactPhone ?? "",
        contactEmail: a.contactEmail ?? "",
        createdAt: a.createdAt.toISOString(),
        lastEditedByAdmin: a.lastEditedByAdmin ?? "",
        lastEditedAt: a.lastEditedAt ? a.lastEditedAt.toISOString() : "",
      })),
      ["id", "userId", "title", "category", "location", "product", "quantity", "unit", "listingType", "price", "status", "isPromoted", "contactPhone", "contactEmail", "createdAt", "lastEditedByAdmin", "lastEditedAt"],
    );
    await recordAuditLog({
      req, action: "exports.ads", targetType: "export",
      summary: `Export CSV des annonces (${rows.length} ligne(s))`,
    });
    sendCsv(res, `annonces-${dateStamp()}.csv`, csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de l'export." });
  }
});

/** GET /admin/export/subscriptions — export CSV de tous les abonnements */
router.get("/admin/export/subscriptions", adminAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: subscriptionsTable.id,
        userId: subscriptionsTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        planName: plansTable.name,
        status: subscriptionsTable.status,
        stripeSubscriptionId: subscriptionsTable.stripeSubscriptionId,
        stripeCustomerId: subscriptionsTable.stripeCustomerId,
        currentPeriodEnd: subscriptionsTable.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptionsTable.cancelAtPeriodEnd,
        createdAt: subscriptionsTable.createdAt,
      })
      .from(subscriptionsTable)
      .leftJoin(usersTable, eq(subscriptionsTable.userId, usersTable.id))
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .orderBy(desc(subscriptionsTable.createdAt));
    const csv = toCsv(
      rows.map((s) => ({
        id: s.id,
        userId: s.userId,
        userName: s.userName ?? "",
        userEmail: s.userEmail ?? "",
        planName: s.planName ?? "",
        status: s.status,
        stripeSubscriptionId: s.stripeSubscriptionId ?? "",
        stripeCustomerId: s.stripeCustomerId ?? "",
        currentPeriodEnd: s.currentPeriodEnd ? s.currentPeriodEnd.toISOString() : "",
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        createdAt: s.createdAt.toISOString(),
      })),
      ["id", "userId", "userName", "userEmail", "planName", "status", "stripeSubscriptionId", "stripeCustomerId", "currentPeriodEnd", "cancelAtPeriodEnd", "createdAt"],
    );
    await recordAuditLog({
      req, action: "exports.subscriptions", targetType: "export",
      summary: `Export CSV des abonnements (${rows.length} ligne(s))`,
    });
    sendCsv(res, `abonnements-${dateStamp()}.csv`, csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de l'export." });
  }
});

/** GET /admin/export/donations — export CSV de tous les dons */
router.get("/admin/export/donations", adminAuth, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: donationsTable.id,
        userId: donationsTable.userId,
        userName: usersTable.name,
        userEmail: usersTable.email,
        amount: donationsTable.amount,
        currency: donationsTable.currency,
        donorName: donationsTable.donorName,
        donorEmail: donationsTable.donorEmail,
        status: donationsTable.status,
        stripeSessionId: donationsTable.stripeSessionId,
        stripePaymentIntentId: donationsTable.stripePaymentIntentId,
        createdAt: donationsTable.createdAt,
      })
      .from(donationsTable)
      .leftJoin(usersTable, eq(donationsTable.userId, usersTable.id))
      .orderBy(desc(donationsTable.createdAt));
    const csv = toCsv(
      rows.map((d) => ({
        id: d.id,
        userId: d.userId ?? "",
        userName: d.userName ?? "",
        userEmail: d.userEmail ?? "",
        amount: (d.amount / 100).toFixed(2),
        currency: d.currency,
        donorName: d.donorName ?? "",
        donorEmail: d.donorEmail ?? "",
        status: d.status,
        stripeSessionId: d.stripeSessionId ?? "",
        stripePaymentIntentId: d.stripePaymentIntentId ?? "",
        createdAt: d.createdAt.toISOString(),
      })),
      ["id", "userId", "userName", "userEmail", "amount", "currency", "donorName", "donorEmail", "status", "stripeSessionId", "stripePaymentIntentId", "createdAt"],
    );
    await recordAuditLog({
      req, action: "exports.donations", targetType: "export",
      summary: `Export CSV des dons (${rows.length} ligne(s))`,
    });
    sendCsv(res, `dons-${dateStamp()}.csv`, csv);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de l'export." });
  }
});

export default router;
