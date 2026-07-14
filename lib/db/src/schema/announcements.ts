import { pgTable, serial, text, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";

export const announcementStyleEnum = pgEnum("announcement_style", ["info", "warning", "success"]);

export const announcementsTable = pgTable("announcements", {
  id: serial("id").primaryKey(),
  message: text("message").notNull(),
  style: announcementStyleEnum("style").notNull().default("info"),
  isActive: boolean("is_active").notNull().default(false),
  // Optional scheduling window — null means "no bound" on that side.
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Announcement = typeof announcementsTable.$inferSelect;
export type InsertAnnouncement = typeof announcementsTable.$inferInsert;
