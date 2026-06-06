import { z } from "zod";
import { ALL_PERMISSIONS, type Permission } from "@/lib/roles";

const permissionEnum = z.enum(
  ALL_PERMISSIONS as [Permission, ...Permission[]],
);

export const createStaffSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
  email: z.string().trim().email("Correo inválido").max(200),
  password: z.string().min(8, "Mínimo 8 caracteres").max(200),
  permissions: z.array(permissionEnum).default([]),
});
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

export const updateStaffSchema = z.object({
  permissions: z.array(permissionEnum).optional(),
  password: z.string().min(8, "Mínimo 8 caracteres").max(200).optional(),
});
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
