import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
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
  description: z.string().trim().max(2000, "Máximo 2000 caracteres").optional(),
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

/** Per-photo stock for a variant image. Null clears photo-level tracking. */
export const imageStockInputSchema = z.object({
  stock: z.coerce.number().int().min(0).nullable(),
});
export type ImageStockInput = z.infer<typeof imageStockInputSchema>;
