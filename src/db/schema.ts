import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// --- Users ---------------------------------------------------------------
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name"),
  phone: text("phone"),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Products (each row = one limited, story-driven drop) -----------------
export const products = pgTable("products", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  tagline: text("tagline").notNull().default(""),
  story: text("story").notNull(),
  priceCents: integer("price_cents").notNull(),
  images: text("images").notNull(),
  sizes: text("sizes").notNull().default('["S","M","L","XL","XXL"]'),
  totalStock: integer("total_stock").notNull(),
  stockRemaining: integer("stock_remaining").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Orders ------------------------------------------------------------
// paymentMethod/paymentReference are deliberately generic (not Stripe-shaped)
// so a Morocco-compatible gateway (CMI, PayZone, ChariBaaS) can be added
// later without touching this table. See PAYMENTS.md.
export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method").notNull().default("cod"),
  paymentReference: text("payment_reference"),
  subtotalCents: integer("subtotal_cents").notNull(),
  pointsRedeemed: integer("points_redeemed").notNull().default(0),
  discountCents: integer("discount_cents").notNull().default(0),
  totalCents: integer("total_cents").notNull(),
  pointsAwarded: integer("points_awarded").notNull().default(0),
  shippingName: text("shipping_name").notNull(),
  shippingPhone: text("shipping_phone").notNull(),
  shippingAddress: text("shipping_address").notNull(),
  shippingCity: text("shipping_city").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  productName: text("product_name").notNull(),
  size: text("size"),
  quantity: integer("quantity").notNull(),
  priceCents: integer("price_cents").notNull(),
});

// --- Points ledger (append-only, so balances are always auditable) --------
export const pointsTransactions = pgTable("points_transactions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  amount: integer("amount").notNull(),
  reason: text("reason").notNull(),
  orderId: text("order_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// --- Relations (enables nested `with:` queries) ---------------------------
export const usersRelations = relations(users, ({ many }) => ({
  orders: many(orders),
  pointsTransactions: many(pointsTransactions),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const pointsTransactionsRelations = relations(
  pointsTransactions,
  ({ one }) => ({
    user: one(users, {
      fields: [pointsTransactions.userId],
      references: [users.id],
    }),
  })
);
