import { z } from "zod";

export const createCompanySchema = z.object({
  companyName: z.string().trim().min(1, "Nombre de empresa requerido").max(160),
  salonName: z.string().trim().min(1).max(120).default("Salón Principal"),
  ownerName: z.string().trim().min(1, "Nombre del dueño requerido").max(120),
  ownerEmail: z.string().trim().email("Correo inválido").max(200),
  ownerPassword: z.string().min(8, "Mínimo 8 caracteres").max(200),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
