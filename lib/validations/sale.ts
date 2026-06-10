import { z } from "zod";
import { paymentInputSchema } from "./payment";

export const saleItemInputSchema = z.object({
  serviceId: z.string().trim().min(1).nullable().optional(),
  variantId: z.string().trim().min(1).nullable().optional(),
  // Specific photo sold, when the variant tracks stock per photo.
  imageId: z.string().trim().min(1).nullable().optional(),
  staffId: z.string().trim().min(1).nullable().optional(),
  description: z.string().trim().min(1, "Descripción requerida").max(200),
  unitPrice: z.coerce.number().min(0, "Precio inválido"),
  // Units for quantity items; ignored for duration items (uses durationMinutes).
  quantity: z.coerce.number().min(0).default(1),
  // Minutes for duration items.
  durationMinutes: z.coerce.number().int().min(0).default(0),
});

export const saleInputSchema = z.object({
  clientId: z.string().trim().min(1).nullable().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z.array(saleItemInputSchema).min(1, "Agrega al menos un ítem"),
  // Optional payment captured at sale time (POS flow). Omit to leave pending.
  payment: paymentInputSchema.nullable().optional(),
});

export type SaleItemInput = z.infer<typeof saleItemInputSchema>;
export type SaleInput = z.infer<typeof saleInputSchema>;
