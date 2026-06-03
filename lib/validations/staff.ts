import { z } from "zod";
import { ASSIGNABLE_ROLES } from "@/lib/roles";

export const createStaffSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  email: z.string().trim().email("Correo inválido").max(200),
  password: z.string().min(8, "Mínimo 8 caracteres").max(200),
  role: z.enum(ASSIGNABLE_ROLES),
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z
  .object({
    role: z.enum(ASSIGNABLE_ROLES).optional(),
    password: z.string().min(8, "Mínimo 8 caracteres").max(200).optional(),
  })
  .refine((v) => v.role || v.password, {
    message: "Nada que actualizar",
  });
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
