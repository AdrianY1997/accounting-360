import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  parentId: z.string().trim().min(1).nullable().optional(),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const measureTypes = ["quantity", "duration"] as const;
export type MeasureType = (typeof measureTypes)[number];
export const measureTypeLabels: Record<MeasureType, string> = {
  quantity: "Cantidad",
  duration: "Duración",
};

export const priceModes = ["per_unit", "fixed"] as const;
export type PriceMode = (typeof priceModes)[number];
export const priceModeLabels: Record<PriceMode, string> = {
  per_unit: "Por hora (escala con duración)",
  fixed: "Precio fijo",
};

export const serviceInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  summary: z.string().trim().max(300, "Máximo 300 caracteres").optional(),
  description: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
  features: z
    .array(z.string().trim().min(1).max(120))
    .max(12, "Máximo 12 puntos")
    .optional(),
  attributes: z
    .record(z.string().max(60), z.string().trim().max(4000))
    .optional(),
  categoryId: z.string().trim().min(1).nullable().optional(),
  price: z.coerce.number().min(0, "Precio inválido").default(0),
  costPrice: z.coerce.number().min(0).default(0),
  resellerPrice: z.coerce.number().min(0).default(0),
  minPrice: z.coerce.number().min(0).default(0),
  measureType: z.enum(measureTypes).default("quantity"),
  priceMode: z.enum(priceModes).default("per_unit"),
  durationMinutes: z.coerce
    .number()
    .int("Minutos inválidos")
    .min(0)
    .default(0),
  tracksStock: z.boolean().optional(),
  active: z.boolean().optional(),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;

export const variantInputSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  price: z.coerce.number().min(0).default(0),
  costPrice: z.coerce.number().min(0).default(0),
  resellerPrice: z.coerce.number().min(0).default(0),
  minPrice: z.coerce.number().min(0).default(0),
  stock: z.coerce.number().int().min(0).default(0),
});
export type VariantInput = z.infer<typeof variantInputSchema>;

/**
 * Per-photo update: `stock` (null clears photo-level tracking; variant photos
 * only) and/or `aiKind` (AI disclosure: reference | generated | null = real
 * photo). At least one field must be present (enforced in the route).
 */
export const imageUpdateSchema = z.object({
  stock: z.coerce.number().int().min(0).nullable().optional(),
  aiKind: z.enum(["reference", "generated"]).nullable().optional(),
});
export type ImageUpdateInput = z.infer<typeof imageUpdateSchema>;
