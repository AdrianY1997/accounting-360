import { z } from "zod";

export const paymentMethods = ["cash", "card", "transfer", "other"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  card: "Tarjeta",
  transfer: "Transferencia",
  other: "Otro",
};

export const paymentInputSchema = z.object({
  method: z.enum(paymentMethods),
  amount: z.coerce.number().positive("Monto inválido"),
});

export type PaymentInput = z.infer<typeof paymentInputSchema>;
