import {
  pgTable,
  uuid,
  varchar,
  text,
  decimal,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const roleEnum = pgEnum("role", ["admin", "kasir"]);
export const discountTypeEnum = pgEnum("discount_type", [
  "auto_by_day",
  "manual_dropdown",
]);
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "qris",
  "other",
]);

// 1. Users
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("kasir"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Categories
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Products (Induk)
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  categoryId: uuid("category_id")
    .references(() => categories.id, { onDelete: "restrict" })
    .notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  basePrice: decimal("base_price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Product Variants
export const productVariants = pgTable("product_variants", {
  id: uuid("id").defaultRandom().primaryKey(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  size: varchar("size", { length: 50 }),
  color: varchar("color", { length: 50 }),
  photoUrl: text("photo_url").notNull(), // Wajib ada foto per varian (BR-11)
  priceOverride: decimal("price_override", { precision: 12, scale: 2 }),
  stock: integer("stock").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 5. Discounts
export const discounts = pgTable("discounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  type: discountTypeEnum("type").notNull(),
  dayCondition: varchar("day_condition", { length: 20 }), // misal: "friday"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// 6. Transactions
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionCode: varchar("transaction_code", { length: 50 }).notNull().unique(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "restrict" })
    .notNull(),
  subtotal: decimal("subtotal", { precision: 12, scale: 2 }).notNull(),
  taxAmount: decimal("tax_amount", { precision: 12, scale: 2 }).notNull(),
  totalDiscountAmount: decimal("total_discount_amount", { precision: 12, scale: 2 })
    .notNull()
    .default("0.00"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  cashReceived: decimal("cash_received", { precision: 12, scale: 2 }),
  changeAmount: decimal("change_amount", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }), // Soft-delete untuk void (US-E2)
});

// 7. Transaction Items (Snapshot data wajib)
export const transactionItems = pgTable("transaction_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id")
    .references(() => transactions.id, { onDelete: "cascade" })
    .notNull(),
  productVariantId: uuid("product_variant_id")
    .references(() => productVariants.id, { onDelete: "restrict" })
    .notNull(),
  productNameSnapshot: varchar("product_name_snapshot", { length: 255 }).notNull(),
  priceSnapshot: decimal("price_snapshot", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: decimal("line_total", { precision: 12, scale: 2 }).notNull(),
});

// 8. Transaction Discounts (Snapshot diskon terpasang)
export const transactionDiscounts = pgTable("transaction_discounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  transactionId: uuid("transaction_id")
    .references(() => transactions.id, { onDelete: "cascade" })
    .notNull(),
  discountId: uuid("discount_id")
    .references(() => discounts.id, { onDelete: "restrict" })
    .notNull(),
  discountNameSnapshot: varchar("discount_name_snapshot", { length: 100 }).notNull(),
  discountPercentageSnapshot: decimal("discount_percentage_snapshot", {
    precision: 5,
    scale: 2,
  }).notNull(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(productVariants),
}));

export const productVariantsRelations = relations(productVariants, ({ one }) => ({
  product: one(products, {
    fields: [productVariants.productId],
    references: [products.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  items: many(transactionItems),
  appliedDiscounts: many(transactionDiscounts),
}));

export const transactionItemsRelations = relations(transactionItems, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionItems.transactionId],
    references: [transactions.id],
  }),
  variant: one(productVariants, {
    fields: [transactionItems.productVariantId],
    references: [productVariants.id],
  }),
}));
