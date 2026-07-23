import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Le nom est trop court").max(80),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  phone: z
    .string()
    .trim()
    .min(9, "Numéro de téléphone invalide")
    .max(20)
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide"),
  password: z.string().min(1, "Entrez votre mot de passe"),
});

export const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  size: z.string().nullable().optional(),
  quantity: z.number().int().min(1).max(10),
});

export const checkoutSchema = z.object({
  items: z.array(checkoutItemSchema).min(1, "Le panier est vide"),
  shipping: z.object({
    name: z.string().trim().min(2, "Le nom est trop court").max(80),
    phone: z.string().trim().min(9, "Numéro de téléphone invalide").max(20),
    address: z.string().trim().min(5, "L'adresse est trop courte").max(300),
    city: z.string().trim().min(2, "La ville est requise").max(80),
  }),
  pointsToRedeem: z.number().int().min(0).max(1_000_000).default(0),
});
