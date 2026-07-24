import { z } from "zod";

// Messages are stable codes, not text — the API routes forward them as-is
// and components map them to localized copy via next-intl's `validation.*`
// namespace. Keeps this module presentation-independent and easy to unit
// test without pulling in next-intl.
export const registerSchema = z.object({
  name: z.string().trim().min(2, "name_too_short").max(80),
  email: z.string().trim().toLowerCase().email("invalid_email"),
  phone: z
    .string()
    .trim()
    .min(9, "phone_invalid")
    .max(20)
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "password_too_short"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("invalid_email"),
  password: z.string().min(1, "password_required"),
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().nullable().optional(),
  quantity: z.number().int().min(1).max(10),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "cart_empty"),
  shipping: z.object({
    name: z.string().trim().min(2, "name_too_short").max(80),
    phone: z.string().trim().min(9, "phone_invalid").max(20),
    address: z.string().trim().min(5, "address_too_short").max(300),
    city: z.string().trim().min(2, "city_required").max(80),
  }),
  pointsToRedeem: z.number().int().min(0).max(1_000_000).default(0),
  locale: z.enum(["fr", "en", "ar"]),
});
