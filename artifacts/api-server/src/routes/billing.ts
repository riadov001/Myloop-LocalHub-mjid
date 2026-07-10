import { Router } from "express";
import { db, subscriptionsTable, plansTable, usersTable } from "@workspace/db";
import { eq, and, inArray, desc, isNotNull } from "drizzle-orm";
import { userAuth, type AuthRequest } from "../middleware/userAuth.js";
import { z } from "zod/v4";

const ACTIVE_STATUSES = ["active", "trialing", "past_due"] as const;
const router = Router();

/** GET /billing/plans — plans publics disponibles */
router.get("/billing/plans", async (req, res) => {
  try {
    const plans = await db.select().from(plansTable).where(eq(plansTable.isActive, true)).orderBy(plansTable.sortOrder);
    res.json(plans);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** GET /billing/subscription — abonnement actif de l'utilisateur connecté */
router.get("/billing/subscription", userAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const [sub] = await db
      .select({ sub: subscriptionsTable, plan: plansTable })
      .from(subscriptionsTable)
      .leftJoin(plansTable, eq(subscriptionsTable.planId, plansTable.id))
      .where(and(eq(subscriptionsTable.userId, userId), inArray(subscriptionsTable.status, ACTIVE_STATUSES)))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);
    if (!sub) {
      res.json(null);
      return;
    }
    res.json({
      id: sub.sub.id,
      status: sub.sub.status,
      plan: sub.plan,
      currentPeriodEnd: sub.sub.currentPeriodEnd?.toISOString() ?? null,
      cancelAtPeriodEnd: sub.sub.cancelAtPeriodEnd,
      stripeSubscriptionId: sub.sub.stripeSubscriptionId,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** POST /billing/checkout — créer une session Stripe Checkout pour un abonnement */
router.post("/billing/checkout", userAuth, async (req: AuthRequest, res) => {
  try {
    const { planId, priceType } = z.object({
      planId: z.number().int().positive(),
      priceType: z.enum(["monthly", "annual"]).default("monthly"),
    }).parse(req.body);

    // Chercher le plan
    const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, planId)).limit(1);
    if (!plan) { res.status(404).json({ error: "Plan introuvable." }); return; }

    // Chercher l'utilisateur
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
    if (!user) { res.status(401).json({ error: "Utilisateur introuvable." }); return; }

    const price = priceType === "annual" ? plan.priceAnnual : plan.priceMonthly;
    const priceInCents = Math.round(parseFloat(price ?? "0") * 100);

    // Import dynamique Stripe
    const { getUncachableStripeClient } = await import("../stripeClient.js");
    const stripe = await getUncachableStripeClient();

    // Réutiliser un customer Stripe existant plutôt que d'en créer un nouveau à chaque checkout.
    // On cherche la ligne la plus récente qui possède déjà un customerId (une session "pending"
    // plus récente sans customerId ne doit pas masquer un customer existant plus ancien).
    const [existingSub] = await db
      .select({ stripeCustomerId: subscriptionsTable.stripeCustomerId })
      .from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, req.user!.id), isNotNull(subscriptionsTable.stripeCustomerId)))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);
    const existingCustomerId = existingSub?.stripeCustomerId ?? undefined;

    const baseUrl = process.env.FRONTEND_URL ?? `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost"}`;
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      ...(existingCustomerId ? { customer: existingCustomerId } : { customer_email: user.email }),
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: { name: plan.name, description: plan.description ?? undefined },
          unit_amount: priceInCents,
          recurring: { interval: priceType === "annual" ? "year" : "month" },
        },
        quantity: 1,
      }],
      metadata: { userId: String(req.user!.id), planId: String(planId) },
      success_url: `${baseUrl}/espace-commercant?billing=success`,
      cancel_url: `${baseUrl}/tarifs?billing=cancelled`,
    });

    // Enregistrer la session en DB
    await db.insert(subscriptionsTable).values({
      userId: req.user!.id,
      planId,
      stripeSessionId: session.id,
      status: "pending",
    });

    res.json({ url: session.url });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la création de la session de paiement." });
  }
});

/** POST /billing/portal — portail Stripe pour gérer l'abonnement */
router.post("/billing/portal", userAuth, async (req: AuthRequest, res) => {
  try {
    // On cherche la ligne la plus récente qui a un customerId Stripe, pas simplement la dernière
    // ligne créée (qui pourrait être un checkout "pending" abandonné sans customerId).
    const [sub] = await db.select().from(subscriptionsTable)
      .where(and(eq(subscriptionsTable.userId, req.user!.id), isNotNull(subscriptionsTable.stripeCustomerId)))
      .orderBy(desc(subscriptionsTable.createdAt))
      .limit(1);
    if (!sub?.stripeCustomerId) {
      res.status(400).json({ error: "Aucun abonnement Stripe actif trouvé." });
      return;
    }
    const { getUncachableStripeClient } = await import("../stripeClient.js");
    const stripe = await getUncachableStripeClient();
    const baseUrl = process.env.FRONTEND_URL ?? `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost"}`;
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${baseUrl}/espace-commercant`,
    });
    res.json({ url: session.url });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de l'ouverture du portail." });
  }
});

export default router;
