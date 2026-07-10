import { Router } from "express";
import { db, donationsTable, platformConfigTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { optionalUserAuth, type AuthRequest } from "../middleware/userAuth.js";
import { z } from "zod/v4";

const router = Router();

async function getPlatformConfig() {
  const rows = await db.select().from(platformConfigTable);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

/** GET /donations — liste des dons récents (publique) */
router.get("/donations", async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 10), 50);
    const rows = await db.select({
      id: donationsTable.id,
      amount: donationsTable.amount,
      currency: donationsTable.currency,
      donorName: donationsTable.donorName,
      status: donationsTable.status,
      createdAt: donationsTable.createdAt,
    }).from(donationsTable)
      .where(eq(donationsTable.status, "completed"))
      .orderBy(desc(donationsTable.createdAt))
      .limit(limit);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur." });
  }
});

/** POST /donations/checkout — créer une session Stripe Checkout pour un don */
router.post("/donations/checkout", optionalUserAuth, async (req: AuthRequest, res) => {
  try {
    const { amount, donorName, donorEmail } = z.object({
      amount: z.number().int().min(100).max(100000), // en centimes
      donorName: z.string().min(1).max(100).optional(),
      donorEmail: z.string().email().optional(),
    }).parse(req.body);

    const config = await getPlatformConfig();
    const orgName = config.site_name ?? "Grainily";

    const { getUncachableStripeClient } = await import("../stripeClient.js");
    const stripe = await getUncachableStripeClient();

    const baseUrl = process.env.FRONTEND_URL ?? `https://${process.env.REPLIT_DOMAINS?.split(",")[0] ?? "localhost"}`;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: donorEmail ?? (req.user ? undefined : undefined),
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: `Don à ${orgName}`,
            description: "Soutenir la plateforme d'échanges locaux",
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      metadata: {
        donorName: donorName ?? "",
        donorEmail: donorEmail ?? "",
        userId: req.user ? String(req.user.id) : "",
      },
      success_url: `${baseUrl}/dons?success=1`,
      cancel_url: `${baseUrl}/dons?cancelled=1`,
    });

    // Enregistrer le don en DB (pending)
    await db.insert(donationsTable).values({
      userId: req.user?.id ?? null,
      amount,
      currency: "eur",
      donorName: donorName ?? null,
      donorEmail: donorEmail ?? null,
      stripeSessionId: session.id,
      status: "pending",
    });

    res.json({ url: session.url });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur lors de la création du don." });
  }
});

export default router;
