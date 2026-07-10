const DEV_FALLBACK_PASSWORD = "Root@26!";

/**
 * Returns the root admin password. In production, ROOT_ADMIN_PASSWORD must be set explicitly —
 * we fail fast at startup instead of silently accepting the hardcoded password that is visible
 * to anyone who can read the source code.
 */
function resolveRootPassword(): string {
  const fromEnv = process.env.ROOT_ADMIN_PASSWORD;
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ROOT_ADMIN_PASSWORD environment variable is required in production but was not provided.",
    );
  }

  return DEV_FALLBACK_PASSWORD;
}

export const ROOT_PASSWORD = resolveRootPassword();
