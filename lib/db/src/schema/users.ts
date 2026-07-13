import { pgTable, serial, text, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["customer", "merchant", "moderator"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  // RBAC — ajouté après v1, toujours nullable/default pour compatibilité
  role: userRoleEnum("role").notNull().default("customer"),
  // Vérification email
  emailVerified: boolean("email_verified").notNull().default(false),
  emailVerifyToken: text("email_verify_token"),
  emailVerifyTokenExpires: timestamp("email_verify_token_expires"),
  // Réinitialisation mot de passe
  resetToken: text("reset_token"),
  resetTokenExpires: timestamp("reset_token_expires"),
  // Méta
  lastLoginAt: timestamp("last_login_at"),
  // Coordonnées
  phone: text("phone"),
  // Modération — suspension de compte par un admin root
  isSuspended: boolean("is_suspended").notNull().default(false),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true, createdAt: true, role: true,
  emailVerified: true, emailVerifyToken: true, emailVerifyTokenExpires: true,
  resetToken: true, resetTokenExpires: true, lastLoginAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
export type UserRole = "customer" | "merchant" | "moderator";
