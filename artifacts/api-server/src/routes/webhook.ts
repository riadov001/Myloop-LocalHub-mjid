import { Router } from "express";
import { db, subscriptionsTable, donationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger.js";

const router = Router();

/**
 * POST /api/webhooks/stripe
 *
 * Reçoit les événements Stripe Checkout. Doit être enregistré AVANT express.json()
 * pour conserver le body brut nécessaire à la vérification de signature.
 */
router.post("/webhooks/stripe", async (req, res) => {
  try {
    const { getStripeSync } = await import("../stripeClient.js");
    const sync = await getStripeSync();

    // Vérification signature Stripe via stripe-replit-sync
    const signature = req.headers["stripe-signature"] as string;
    const rawBody = req.body as Buffer;

    let event: { type: string; data: { object: Record<string, unknown> } };
    try {
      // stripe-replit-sync gère la vérification webhook
      await sync.processWebhook(rawBody, signature);
      // On parse quand même l'événement pour nos mises à jour DB
      const { getUncachableStripeClient } = await import("../stripeClient.js");
      const stripe = await getUncachableStripeClient();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret) as unknown as typeof event;
      } else if (process.env.NODE_ENV === "production") {
        // En production, un secret de webhook manquant est une erreur de configuration : on refuse
        // de traiter l'événement plutôt que de faire confiance à un body non vérifié.
        logger.error("STRIPE_WEBHOOK_SECRET manquant en production — webhook rejeté.");
        res.status(500).json({ error: "Configuration webhook manquante." });
        return;
      } else {
        // Sans secret, on parse le body brut (dev only)
        event = JSON.parse(rawBody.toString()) as typeof event;
      }
    } catch (err) {
      logger.warn({ err }, "Webhook signature verification failed");
      res.status(400).json({ error: "Signature webhook invalide." });
      return;
    }

    logger.info({ type: event.type }, "Stripe webhook received");
    await handleEvent(event);
    res.json({ received: true });
  } catch (err) {
    logger.error({ err }, "Webhook processing error");
    res.status(500).json({ error: "Erreur traitement webhook." });
  }
});

async function handleEvent(event: { type: string; data: { object: Record<string, unknown> } }) {
  const obj = event.data.object;

  switch (event.type) {
    // ── Checkout complété (abonnement ou don) ──
    case "checkout.session.completed": {
      const sessionId = obj["id"] as string;
      const mode = obj["mode"] as string;
      const customerId = obj["customer"] as string | null;
      const subscriptionId = obj["subscription"] as string | null;
      const paymentIntentId = obj["payment_intent"] as string | null;
      const meta = (obj["metadata"] as Record<string, string>) ?? {};

      if (mode === "subscription" && subscriptionId) {
        // Mettre à jour l'abonnement en DB
        await db.update(subscriptionsTable)
          .set({
            stripeSubscriptionId: subscriptionId,
            stripeCustomerId: customerId,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(subscriptionsTable.stripeSessionId, sessionId));
      } else if (mode === "payment") {
        // Don complété
        await db.update(donationsTable)
          .set({
            status: "completed",
            stripePaymentIntentId: paymentIntentId,
          })
          .where(eq(donationsTable.stripeSessionId, sessionId));
      }
      break;
    }

    // ── Abonnement mis à jour par Stripe ──
    case "customer.subscription.updated": {
      const stripeSubId = obj["id"] as string;
      const status = obj["status"] as string;
      const cancelAtPeriodEnd = obj["cancel_at_period_end"] as boolean;
      const currentPeriodEnd = obj["current_period_end"] as number | null;
      const customerId = obj["customer"] as string;

      const dbStatus = mapStripeStatus(status);
      await db.update(subscriptionsTable)
        .set({
          status: dbStatus,
          cancelAtPeriodEnd,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd * 1000) : null,
          stripeCustomerId: customerId,
          updatedAt: new Date(),
        })
        .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubId));
      break;
    }

    // ── Abonnement annulé/supprimé ──
    case "customer.subscription.deleted": {
      const stripeSubId = obj["id"] as string;
      await db.update(subscriptionsTable)
        .set({ status: "cancelled", updatedAt: new Date() })
        .where(eq(subscriptionsTable.stripeSubscriptionId, stripeSubId));
      break;
    }

    // ── Paiement échoué ──
    case "invoice.payment_failed": {
      const subscriptionId = obj["subscription"] as string | null;
      if (subscriptionId) {
        await db.update(subscriptionsTable)
          .set({ status: "past_due", updatedAt: new Date() })
          .where(eq(subscriptionsTable.stripeSubscriptionId, subscriptionId));
      }
      break;
    }

    // ── Paiement (don) échoué ──
    case "payment_intent.payment_failed": {
      const piId = obj["id"] as string;
      await db.update(donationsTable)
        .set({ status: "failed" })
        .where(eq(donationsTable.stripePaymentIntentId, piId));
      break;
    }

    default:
      logger.info({ type: event.type }, "Webhook event unhandled (ignoré)");
  }
}

function mapStripeStatus(stripeStatus: string): "active" | "cancelled" | "past_due" | "trialing" | "expired" | "pending" {
  switch (stripeStatus) {
    case "active": return "active";
    case "canceled": return "cancelled";
    case "past_due": return "past_due";
    case "trialing": return "trialing";
    case "incomplete_expired": return "expired";
    default: return "pending";
  }
}

export default router;
