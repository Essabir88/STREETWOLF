import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "الاسم قصير جداً").max(80),
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح"),
  phone: z
    .string()
    .trim()
    .min(9, "رقم هاتف غير صالح")
    .max(20)
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "كلمة السر يجب أن تكون 8 خانات على الأقل"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("بريد إلكتروني غير صالح"),
  password: z.string().min(1, "أدخل كلمة السر"),
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().nullable().optional(),
  quantity: z.number().int().min(1).max(10),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "السلة فارغة"),
  shipping: z.object({
    name: z.string().trim().min(2, "الاسم قصير جداً").max(80),
    phone: z.string().trim().min(9, "رقم هاتف غير صالح").max(20),
    address: z.string().trim().min(5, "العنوان قصير جداً").max(300),
    city: z.string().trim().min(2, "المدينة مطلوبة").max(80),
  }),
  pointsToRedeem: z.number().int().min(0).max(1_000_000).default(0),
});
