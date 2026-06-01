import { z } from "zod";

export const saleItemInputSchema = z.object({
  serviceId: z.string().trim().min(1).nullable().optional(),
  staffId: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().min(1, "Descripción requerida").max(200),
  unitPrice: z.coerce.number().min(0, "Precio inválido"),
  quantity: z.coerce.number().int().min(1, "Cantidad mínima 1"),
});

export const saleInputSchema = z.object({
  clientId: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(saleItemInputSchema).min(1, "Agrega al menos un ítem"),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type SaleInput = z.infer<typeof saleInputSchema>;
