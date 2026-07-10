import { pgTable, serial, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const brandingTable = pgTable("branding", {
  id: serial("id").primaryKey(),
  logoUrl: text("logo_url"),
  primaryColor: text("primary_color").notNull().default("#2563eb"),
  accentColor: text("accent_color").notNull().default("#1d4ed8"),
  backgroundColor: text("background_color").notNull().default("#ffffff"),
  fontFamily: text("font_family").notNull().default("Inter"),
  siteName: text("site_name").notNull().default("Grainily"),
});

export const insertBrandingSchema = createInsertSchema(brandingTable).omit({ id: true });
export type InsertBranding = z.infer<typeof insertBrandingSchema>;
export type Branding = typeof brandingTable.$inferSelect;
