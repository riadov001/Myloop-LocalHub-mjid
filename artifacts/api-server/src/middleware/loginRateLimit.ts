import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

/**
 * Two layers of brute-force protection for login endpoints:
 *
 * 1. Per-IP rate limit (express-rate-limit): caps the raw number of login
 *    attempts an IP can make in a window, regardless of which account it
 *    targets. Stops a single attacker from spraying many passwords fast.
 *
 * 2. Per-account lockout (in-memory map keyed by normalized email): caps
 *    failed attempts against a single account regardless of source IP.
 *    Stops distributed/botnet attacks that spread requests across many IPs
 *    to target one victim account. Resets on a successful login.
 *
 * The in-memory account store is per-process. That's an accepted tradeoff
 * for this deployment (single API server instance) — it resets on restart,
 * which only weakens (never breaks) the protection, and avoids adding a
 * Redis/DB dependency purely for login throttling.
 */

const ACCOUNT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const ACCOUNT_MAX_FAILURES = 5;
const ACCOUNT_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

interface AccountEntry {
  failures: number;
  windowStart: number;
  lockedUntil?: number;
}

const accountAttempts = new Map<string, AccountEntry>();

// Periodic cleanup so the map doesn't grow unbounded under sustained attack traffic.
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of accountAttempts) {
    const stale = (!entry.lockedUntil || entry.lockedUntil < now) && now - entry.windowStart > ACCOUNT_WINDOW_MS;
    if (stale) accountAttempts.delete(key);
  }
}, 10 * 60 * 1000).unref();

function normalizeKey(email: unknown): string {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

/** Call before attempting credential verification. Returns lockout info if the account is currently locked. */
export function checkAccountLockout(email: unknown): { locked: boolean; retryAfterSeconds?: number } {
  const key = normalizeKey(email);
  if (!key) return { locked: false };
  const entry = accountAttempts.get(key);
  if (!entry?.lockedUntil) return { locked: false };
  const now = Date.now();
  if (entry.lockedUntil > now) {
    return { locked: true, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  // Lockout expired — clear it.
  accountAttempts.delete(key);
  return { locked: false };
}

/** Call after a failed credential check. */
export function recordFailedLogin(email: unknown): void {
  const key = normalizeKey(email);
  if (!key) return;
  const now = Date.now();
  const entry = accountAttempts.get(key);
  if (!entry || now - entry.windowStart > ACCOUNT_WINDOW_MS) {
    accountAttempts.set(key, { failures: 1, windowStart: now });
    return;
  }
  entry.failures += 1;
  if (entry.failures >= ACCOUNT_MAX_FAILURES) {
    entry.lockedUntil = now + ACCOUNT_LOCKOUT_MS;
  }
  accountAttempts.set(key, entry);
}

/** Call after a successful login to clear any prior failure history. */
export function resetLoginFailures(email: unknown): void {
  const key = normalizeKey(email);
  if (!key) return;
  accountAttempts.delete(key);
}

/**
 * Express middleware: rejects the request early if the target account
 * (req.body.email) is currently locked out. Use alongside the per-IP
 * rate limiter below.
 */
export function accountLockoutGuard(req: Request, res: Response, next: NextFunction): void {
  const { locked, retryAfterSeconds } = checkAccountLockout((req.body as { email?: unknown } | undefined)?.email);
  if (locked) {
    res.status(429).json({
      error: "Trop de tentatives échouées pour ce compte. Réessayez plus tard.",
      retryAfterSeconds,
    });
    return;
  }
  next();
}

/** Per-IP rate limiter for login endpoints: 10 attempts per 15 minutes. */
export const loginIpRateLimit = rateLimit({
  windowMs: ACCOUNT_WINDOW_MS,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Trop de tentatives de connexion depuis cette adresse. Réessayez plus tard." },
});
