import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
import { RuleFormDialog } from "@/components/commissions/rule-form-dialog";
import { PeriodFilter } from "@/components/period-filter";
import { ResourceDeleteButton } from "@/components/resource-delete-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listServices } from "@/services/catalog";
import { computeCommissions, listRules } from "@/services/commissions";
import { listSalonStaff } from "@/services/sales";
import { can } from "@/lib/roles";
import { monthRange, parseRange, toDateInput } from "@/lib/period";
import { requireSalonContext } from "@/lib/tenant";
import {
  commissionTypeLabels,
  type CommissionType,
} from "@/lib/validations/commission";

export default async function CommissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "reports:view")) redirect("/dashboard");
  const manageRules = can(ctx, "commissions:manage");
  const sp = await searchParams;
  const { from, to } = parseRange(sp.from ?? null, sp.to ?? null) ?? monthRange();

  const [report, rules, staff, services, settings] = await Promise.all([
    computeCommissions(ctx, from, to),
    listRules(ctx),
    listSalonStaff(ctx),
    listServices(ctx),
    db.query.salonSettings.findFirst({
      where: eq(salonSettings.teamId, ctx.salonId),
    }),
  ]);
  const fmt = new Intl.NumberFormat("es", {
    style: "currency",
    currency: settings?.currency ?? "USD",
  });
  const serviceOpts = services.map((s) => ({ id: s.id, name: s.name }));

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">Comisiones</h1>
          <PeriodFilter from={toDateInput(from)} to={toDateInput(to)} />
        </div>

        {report.rows.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Sin comisiones en el periodo.
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead className="text-right">Ítems</TableHead>
                  <TableHead className="text-right">Base</TableHead>
                  <TableHead className="text-right">Comisión</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.rows.map((r) => (
                  <TableRow key={r.staffId}>
                    <TableCell className="font-medium">
                      {r.staffName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">{r.items}</TableCell>
                    <TableCell className="text-right">
                      {fmt.format(Number(r.base))}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt.format(Number(r.commission))}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-semibold">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {fmt.format(Number(report.total))}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {manageRules && (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Reglas</h2>
          <RuleFormDialog
            staff={staff}
            services={serviceOpts}
            trigger={
              <Button variant="outline" size="sm">
                <Plus className="size-4" />
                Nueva regla
              </Button>
            }
          />
        </div>

        {rules.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm">Sin reglas.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff</TableHead>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-20 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.staffName ?? "Todos"}</TableCell>
                    <TableCell>{r.serviceName ?? "Todos"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {commissionTypeLabels[r.type as CommissionType] ?? r.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {r.type === "percent"
                        ? `${Number(r.value)}%`
                        : fmt.format(Number(r.value))}
                    </TableCell>
                    <TableCell className="flex justify-end text-right">
                      <RuleFormDialog
                        rule={r}
                        staff={staff}
                        services={serviceOpts}
                        trigger={
                          <Button variant="ghost" size="icon" aria-label="Editar">
                            <Pencil className="size-4" />
                          </Button>
                        }
                      />
                      <ResourceDeleteButton
                        endpoint={`/api/commission-rules/${r.id}`}
                        name="esta regla"
                        successMessage="Regla eliminada"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
      )}
    </div>
  );
}
