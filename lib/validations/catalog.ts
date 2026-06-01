import { z } from "zod";

export const categoryInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
});
export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const serviceInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  categoryId: z.string().trim().min(1).nullable().optional(),
  price: z.coerce.number().min(0, "Precio inválido").default(0),
  durationMinutes: z.coerce
    .number()
    .int("Minutos inválidos")
    .min(0)
    .default(0),
  active: z.boolean().optional(),
});
export type ServiceInput = z.infer<typeof serviceInputSchema>;
