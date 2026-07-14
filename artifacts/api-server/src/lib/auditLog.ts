import type { Request } from "express";
import { db, auditLogsTable } from "@workspace/db";
import type { AdminJwtPayload } from "../middleware/adminAuth.js";
import { ROOT_EMAIL } from "./rootCredentials.js";

type AdminReq = Request & { adminPayload?: AdminJwtPayload };

interface RecordAuditLogInput {
  req: Request;
  action: string;
  targetType: string;
  targetId?: string | number | null;
  summary: string;
  metadata?: Record<string, unknown>;
}

/**
 * Records a privileged write action (create/update/delete/status-change) performed by
 * an admin or root through the admin panel. Never throws — a logging failure must not
 * break the underlying admin action, so errors are swallowed and logged locally.
 */
export async function recordAuditLog({
  req,
  action,
  targetType,
  targetId,
  summary,
  metadata,
}: RecordAuditLogInput): Promise<void> {
  try {
    const payload = (req as AdminReq).adminPayload;
    if (!payload) {
      req.log?.warn?.({ action, targetType }, "recordAuditLog called without an authenticated admin/root actor");
      return;
    }

    const actorLabel = payload.sub === "root" ? ROOT_EMAIL : `admin #${payload.sub}`;

    await db.insert(auditLogsTable).values({
      actorId: payload.sub,
      actorRole: payload.role,
      actorLabel,
      action,
      targetType,
      targetId: targetId === undefined || targetId === null ? null : String(targetId),
      summary,
      metadata: metadata ?? null,
    });
  } catch (err) {
    req.log?.error?.(err, "Failed to record audit log entry");
  }
}
