import { z } from "zod";

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
});

export type SalonSettingsInput = z.infer<typeof salonSettingsSchema>;
