import { Router } from "express";
import { db, auditLogsTable } from "@workspace/db";
import { and, desc, eq, gte, lte, count } from "drizzle-orm";
import { rootAuth } from "../middleware/adminAuth";
import { z } from "zod/v4";

const router = Router();

const QuerySchema = z.object({
  actorId: z.string().optional(),
  action: z.string().optional(),
  targetType: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(25),
});

function serialize(row: typeof auditLogsTable.$inferSelect) {
  return {
    id: row.id,
    actorId: row.actorId,
    actorRole: row.actorRole,
    actorLabel: row.actorLabel,
    action: row.action,
    targetType: row.targetType,
    targetId: row.targetId ?? null,
    summary: row.summary,
    metadata: row.metadata ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

// GET /admin/audit-log — root only: searchable/filterable audit trail
router.get("/admin/audit-log", rootAuth, async (req, res) => {
  try {
    const query = QuerySchema.parse(req.query);
    const conditions = [];
    if (query.actorId) conditions.push(eq(auditLogsTable.actorId, query.actorId));
    if (query.action) conditions.push(eq(auditLogsTable.action, query.action));
    if (query.targetType) conditions.push(eq(auditLogsTable.targetType, query.targetType));
    if (query.dateFrom) conditions.push(gte(auditLogsTable.createdAt, new Date(query.dateFrom)));
    if (query.dateTo) conditions.push(lte(auditLogsTable.createdAt, new Date(query.dateTo)));

    const where = conditions.length ? and(...conditions) : undefined;
    const offset = (query.page - 1) * query.limit;

    const rows = await db
      .select()
      .from(auditLogsTable)
      .where(where)
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(query.limit)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count() })
      .from(auditLogsTable)
      .where(where);

    res.json({
      rows: rows.map(serialize),
      total,
      page: query.page,
      limit: query.limit,
    });
  } catch (err) {
    req.log.error(err);
    res.status(400).json({ error: "Requête invalide" });
  }
});

// GET /admin/audit-log/actions — root only: distinct action types for the filter dropdown
router.get("/admin/audit-log/actions", rootAuth, async (req, res) => {
  try {
    const rows = await db
      .selectDistinct({ action: auditLogsTable.action })
      .from(auditLogsTable)
      .orderBy(auditLogsTable.action);
    res.json(rows.map((r) => r.action));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

export default router;
