import { z } from "zod";

export const clientInputSchema = z.object({
  fullName: z.string().trim().min(1, "El nombre es obligatorio").max(200),
  phone: z.string().trim().max(50).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Correo inválido")
    .max(200)
    .optional()
    .or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  active: z.boolean().optional(),
});

export type ClientInput = z.infer<typeof clientInputSchema>;
