import { z } from "zod";

export const createSalonSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(120),
});
export type CreateSalonInput = z.infer<typeof createSalonSchema>;
