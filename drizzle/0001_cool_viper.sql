-- name/tagline/story were plain text (one language). Converting straight to
-- jsonb would fail because "Circle Logo" isn't valid JSON. Instead, wrap the
-- existing French value into {fr,en,ar} with the FR text duplicated into
-- en/ar as a starting point until real translations are entered (via
-- db:seed or the admin data). This preserves all existing content.
ALTER TABLE "products" ALTER COLUMN "name" TYPE jsonb
  USING jsonb_build_object('fr', "name", 'en', "name", 'ar', "name");--> statement-breakpoint

-- tagline's old default ('' — a plain empty string, not valid JSON) has to
-- be dropped *before* the type change, otherwise Postgres tries to cast
-- that existing default to jsonb as part of the ALTER and fails with
-- "default for column ... cannot be cast automatically to type jsonb".
ALTER TABLE "products" ALTER COLUMN "tagline" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "tagline" TYPE jsonb
  USING jsonb_build_object('fr', "tagline", 'en', "tagline", 'ar', "tagline");--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "tagline" SET DEFAULT '{"fr":"","en":"","ar":""}'::jsonb;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "story" TYPE jsonb
  USING jsonb_build_object('fr', "story", 'en', "story", 'ar', "story");--> statement-breakpoint

-- images/sizes are already JSON-encoded text (JSON.stringify(...) on write),
-- so a plain cast is enough — no data reshaping needed. sizes' default still
-- has to be dropped first: Postgres won't implicitly cast a column's
-- existing (text-typed) default expression to jsonb as part of the ALTER,
-- even though its content happens to already be valid JSON.
ALTER TABLE "products" ALTER COLUMN "images" TYPE jsonb USING "images"::jsonb;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sizes" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sizes" TYPE jsonb USING "sizes"::jsonb;--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "sizes" SET DEFAULT '["S","M","L","XL","XXL"]'::jsonb;--> statement-breakpoint

-- Defensive cleanup before adding the CHECK constraints, in case the stock
-- race condition (fixed in lib/orders.ts in this same change) ever produced
-- a negative value historically.
UPDATE "products" SET "stock_remaining" = 0 WHERE "stock_remaining" < 0;--> statement-breakpoint
UPDATE "products" SET "total_stock" = 0 WHERE "total_stock" < 0;--> statement-breakpoint

ALTER TABLE "products" ADD CONSTRAINT "stock_remaining_non_negative" CHECK ("products"."stock_remaining" >= 0);--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "total_stock_non_negative" CHECK ("products"."total_stock" >= 0);
