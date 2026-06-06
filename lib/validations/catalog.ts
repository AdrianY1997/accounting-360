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
  categoryId: z.string().trim().min(1).nullable().optional(),
  price: z.coerce.number().min(0, "Precio inválido").default(0),
  measureType: z.enum(measureTypes).default("quantity"),
  priceMode: z.enum(priceModes).default("per_unit"),
  durationMinutes: z.coerce
    .number()
    .int("Minutos inválidos")
    .min(0)
    .default(0),
  active: z.boolean().optional(),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;
