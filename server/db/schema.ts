import { pgTable, serial, text } from "drizzle-orm/pg-core";

export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  full_name: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  visit_date: text("visit_date").notNull(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
});
