import { z } from "zod";
import { paymentMethods } from "./payment";

export const expenseCategoryInputSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
});
export type ExpenseCategoryInput = z.infer<typeof expenseCategoryInputSchema>;

export const expenseInputSchema = z.object({
  categoryId: z.string().trim().min(1).nullable().optional(),
  vendor: z.string().trim().max(200).optional().or(z.literal("")),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  amount: z.coerce.number().min(0, "Monto inválido"),
  paymentMethod: z.enum(paymentMethods).nullable().optional(),
  // ISO date string (YYYY-MM-DD); omitted = now.
  expenseDate: z.string().trim().min(1).optional(),
});
export type ExpenseInput = z.infer<typeof expenseInputSchema>;
