import { z } from "zod";

export const commissionTypes = ["percent", "fixed"] as const;
export type CommissionType = (typeof commissionTypes)[number];

export const commissionTypeLabels: Record<CommissionType, string> = {
  percent: "Porcentaje",
  fixed: "Fijo",
};

export const commissionBases = ["line", "margin"] as const;
export type CommissionBase = (typeof commissionBases)[number];
export const commissionBaseLabels: Record<CommissionBase, string> = {
  line: "Total de línea",
  margin: "Margen (venta − costo)",
};

export const commissionRuleInputSchema = z.object({
  staffId: z.string().trim().min(1).nullable().optional(),
  serviceId: z.string().trim().min(1).nullable().optional(),
  type: z.enum(commissionTypes),
  base: z.enum(commissionBases).default("line"),
  value: z.coerce.number().min(0, "Valor inválido"),
  active: z.boolean().optional(),
});

export type CommissionRuleInput = z.infer<typeof commissionRuleInputSchema>;
