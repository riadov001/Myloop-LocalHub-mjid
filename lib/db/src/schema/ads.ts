import { pgTable, serial, text, timestamp, pgEnum, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const adStatusEnum = pgEnum("ad_status", ["pending", "published", "rejected"]);
export const listingTypeEnum = pgEnum("listing_type", ["free", "flexible", "fixed"]);
export const subscriptionTypeEnum = pgEnum("subscription_type", ["none", "weekly", "monthly", "annual"]);

export const adsTable = pgTable("ads", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),  // nullable — rétrocompatible avec annonces existantes
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  product: text("product").notNull(),
  quantity: text("quantity"),
  unit: text("unit"),
  category: text("category").notNull(),
  listingType: listingTypeEnum("listing_type").notNull().default("flexible"),
  price: text("price"),
  isPromoted: boolean("is_promoted").notNull().default(false),
  promotionDuration: integer("promotion_duration"),
  promotionPrice: text("promotion_price"),
  subscriptionType: subscriptionTypeEnum("subscription_type").notNull().default("none"),
  subscriptionPrice: text("subscription_price"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  status: adStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastEditedByAdmin: text("last_edited_by_admin"),
  lastEditedAt: timestamp("last_edited_at", { withTimezone: true }),
});

export const insertAdSchema = createInsertSchema(adsTable).omit({ id: true, createdAt: true, status: true });
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof adsTable.$inferSelect;
