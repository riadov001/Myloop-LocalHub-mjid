import Stripe from 'stripe';
import { StripeSync } from 'stripe-replit-sync';
import { db, platformConfigTable } from '@workspace/db';
import { inArray } from 'drizzle-orm';

async function getDbStripeConfig(): Promise<{ secretKey?: string; webhookSecret?: string }> {
  const rows = await db
    .select({ key: platformConfigTable.key, value: platformConfigTable.value })
    .from(platformConfigTable)
    .where(inArray(platformConfigTable.key, ['stripe_api_key', 'stripe_webhook_secret']));

  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    secretKey: map.stripe_api_key ?? undefined,
    webhookSecret: map.stripe_webhook_secret ?? undefined,
  };
}

async function getStripeCredentials(): Promise<{ secretKey: string; webhookSecret?: string }> {
  // Prefer a key set by an admin from the admin dashboard (Configuration > Intégrations)
  // so changes made there take effect immediately, without redeploying or touching env vars.
  const dbConfig = await getDbStripeConfig();
  if (dbConfig.secretKey) {
    return {
      secretKey: dbConfig.secretKey,
      webhookSecret: dbConfig.webhookSecret,
    };
  }

  // Fall back to a manually configured environment secret.
  const envSecretKey = process.env.STRIPE_SECRET_KEY;
  if (envSecretKey) {
    return {
      secretKey: envSecretKey,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    };
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? "repl " + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
      ? "depl " + process.env.WEB_REPL_RENEWAL
      : null;

  if (!hostname || !xReplitToken) {
    throw new Error(
      'Variables Replit manquantes. Assurez-vous que l\'intégration Stripe est connectée.'
    );
  }

  const resp = await fetch(
    `https://${hostname}/api/v2/connection?include_secrets=true&connector_names=stripe`,
    {
      headers: { Accept: "application/json", X_REPLIT_TOKEN: xReplitToken },
      signal: AbortSignal.timeout(10_000),
    }
  );

  if (!resp.ok) {
    throw new Error(`Échec de récupération des credentials Stripe: ${resp.status} ${resp.statusText}`);
  }

  const data = await resp.json() as { items?: Array<{ settings?: { secret_key?: string; publishable_key?: string; webhook_secret?: string } }> };
  const settings = data.items?.[0]?.settings;

  if (!settings?.secret_key) {
    throw new Error(
      'Intégration Stripe non connectée ou clé secrète manquante. Connectez Stripe via l\'onglet Intégrations.'
    );
  }

  return {
    secretKey: settings.secret_key,
    webhookSecret: settings.webhook_secret,
  };
}

export async function getUncachableStripeClient(): Promise<Stripe> {
  const { secretKey } = await getStripeCredentials();
  return new Stripe(secretKey);
}

export async function getStripeSync(): Promise<StripeSync> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL requis');
  }

  const { secretKey, webhookSecret } = await getStripeCredentials();
  return new StripeSync({
    poolConfig: { connectionString: databaseUrl },
    stripeSecretKey: secretKey,
    stripeWebhookSecret: webhookSecret ?? '',
  });
}
