import { z } from "zod";

export const openSessionSchema = z.object({
  openingBalance: z.coerce.number().min(0, "Saldo inválido").default(0),
});

export const closeSessionSchema = z.object({
  countedAmount: z.coerce.number().min(0, "Monto inválido"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const movementTypes = ["in", "out"] as const;
export type MovementType = (typeof movementTypes)[number];

export const movementTypeLabels: Record<MovementType, string> = {
  in: "Ingreso",
  out: "Egreso",
};

export const movementSchema = z.object({
  type: z.enum(movementTypes),
  amount: z.coerce.number().positive("Monto inválido"),
  description: z.string().trim().min(1, "Descripción requerida").max(200),
});

export type OpenSessionInput = z.infer<typeof openSessionSchema>;
export type CloseSessionInput = z.infer<typeof closeSessionSchema>;
export type MovementInput = z.infer<typeof movementSchema>;
