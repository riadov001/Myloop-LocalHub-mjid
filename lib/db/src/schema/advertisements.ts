import { pgTable, serial, text, timestamp, pgEnum, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const advertisementMediaTypeEnum = pgEnum("advertisement_media_type", ["image", "video"]);

export const advertisementsTable = pgTable("advertisements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  mediaType: advertisementMediaTypeEnum("media_type").notNull().default("image"),
  mediaUrl: text("media_url").notNull(),
  linkUrl: text("link_url"),
  displayOrder: integer("display_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAdvertisementSchema = createInsertSchema(advertisementsTable).omit({ id: true, createdAt: true });
export type InsertAdvertisement = z.infer<typeof insertAdvertisementSchema>;
export type Advertisement = typeof advertisementsTable.$inferSelect;
