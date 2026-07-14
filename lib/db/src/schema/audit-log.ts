import { pgTable, serial, text, timestamp, pgEnum, jsonb } from "drizzle-orm/pg-core";

export const auditActorRoleEnum = pgEnum("audit_actor_role", ["root", "admin"]);

export const auditLogsTable = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  // "root" or numeric admin_users.id serialized as string (matches AdminJwtPayload.sub)
  actorId: text("actor_id").notNull(),
  actorRole: auditActorRoleEnum("actor_role").notNull(),
  // Human-readable label captured at write time (email/name) so the log stays legible
  // even if the admin account is later renamed or deleted.
  actorLabel: text("actor_label").notNull(),
  // Dot-namespaced action, e.g. "ads.update", "members.suspend", "config.update"
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  summary: text("summary").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AuditLogEntry = typeof auditLogsTable.$inferSelect;
export type InsertAuditLogEntry = typeof auditLogsTable.$inferInsert;
