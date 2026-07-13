const DEV_FALLBACK_PASSWORD = "Root@26!";
const DEV_FALLBACK_EMAIL = "root@localhost.dev";

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

/**
 * Returns the root admin email. In production, ROOT_ADMIN_EMAIL must be set explicitly —
 * the identity of the root account is never hardcoded in source so that anyone with read
 * access to the codebase cannot see or target who holds root access.
 */
function resolveRootEmail(): string {
  const fromEnv = process.env.ROOT_ADMIN_EMAIL;
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "ROOT_ADMIN_EMAIL environment variable is required in production but was not provided.",
    );
  }

  return DEV_FALLBACK_EMAIL;
}

export const ROOT_PASSWORD = resolveRootPassword();
export const ROOT_EMAIL = resolveRootEmail();
