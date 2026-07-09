import { z } from "zod";
import { storeTypeIds } from "@/lib/store-types";

export const salonSettingsSchema = z.object({
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .length(3, "Código de moneda de 3 letras"),
  // Entered as a percentage (e.g. 19 = 19%); stored as a decimal (0.19).
  taxRatePercent: z.coerce.number().min(0).max(100),
  timezone: z.string().trim().min(1, "Timezone requerido").max(64),
  address: z.string().trim().max(300).optional().or(z.literal("")),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  logoUrl: z
    .string()
    .trim()
    .url("URL inválida")
    .max(500)
    .optional()
    .or(z.literal("")),
  storeType: z.enum(storeTypeIds).default("generic"),
  whatsapp: z.string().trim().max(30).optional().or(z.literal("")),
  shippingInfo: z.string().trim().max(4000).optional().or(z.literal("")),
});

export type SalonSettingsInput = z.infer<typeof salonSettingsSchema>;
