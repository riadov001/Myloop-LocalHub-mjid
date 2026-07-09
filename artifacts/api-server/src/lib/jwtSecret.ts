const DEV_FALLBACK_SECRET = "localmarket-dev-secret-2026";

/**
 * Returns the JWT signing secret. In production, JWT_SECRET must be set explicitly —
 * we fail fast at startup instead of silently signing tokens with a public, hardcoded
 * fallback (which would let anyone forge auth tokens).
 */
function resolveJwtSecret(): string {
  const fromEnv = process.env.JWT_SECRET;
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET environment variable is required in production but was not provided.",
    );
  }

  return DEV_FALLBACK_SECRET;
}

export const JWT_SECRET = resolveJwtSecret();
