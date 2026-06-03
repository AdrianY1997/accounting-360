import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
import { PeriodFilter } from "@/components/period-filter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { salonReport } from "@/services/reports";
import { monthRange, parseRange, toDateInput } from "@/lib/period";
import { requireSalonContext } from "@/lib/tenant";
import {
  paymentMethodLabels,
  type PaymentMethod,
} from "@/lib/validations/payment";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const ctx = await requireSalonContext();
  const sp = await searchParams;
  const { from, to } = parseRange(sp.from ?? null, sp.to ?? null) ?? monthRange();

  const [report, settings] = await Promise.all([
    salonReport(ctx, from, to),
    db.query.salonSettings.findFirst({
      where: eq(salonSettings.teamId, ctx.salonId),
    }),
  ]);
  const fmt = new Intl.NumberFormat("es", {
    style: "currency",
    currency: settings?.currency ?? "USD",
  });
  const { totals } = report;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <PeriodFilter from={toDateInput(from)} to={toDateInput(to)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Ingresos" value={fmt.format(totals.income)} hint={`${totals.salesCount} ventas`} />
        <Stat title="Gastos" value={fmt.format(totals.expenses)} />
        <Stat title="Comisiones" value={fmt.format(totals.commissions)} />
        <Stat
          title="Utilidad"
          value={fmt.format(totals.profit)}
          hint="ingresos − gastos − comisiones"
          valueClass={totals.profit < 0 ? "text-destructive" : "text-green-600"}
        />
        <Stat title="Impuesto" value={fmt.format(totals.tax)} hint="incluido en ingresos" />
      </div>

      <Section title="Ventas por servicio">
        <BreakdownTable
          rows={report.byService.map((r) => ({
            label: r.name,
            count: r.count,
            total: r.total,
          }))}
          fmt={fmt}
        />
      </Section>

      <Section title="Ventas por staff">
        <BreakdownTable
          rows={report.byStaff.map((r) => ({
            label: r.name,
            count: r.count,
            total: r.total,
          }))}
          fmt={fmt}
        />
      </Section>

      <Section title="Cobrado por método">
        <BreakdownTable
          rows={report.byMethod.map((r) => ({
            label:
              paymentMethodLabels[r.method as PaymentMethod] ?? r.method,
            count: r.count,
            total: r.total,
          }))}
          fmt={fmt}
          footer={{ label: "Total cobrado", total: totals.collected }}
        />
      </Section>
    </div>
  );
}

function Stat({
  title,
  value,
  hint,
  valueClass,
}: {
  title: string;
  value: string;
  hint?: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-semibold ${valueClass ?? ""}`}>{value}</p>
        {hint && <p className="text-muted-foreground text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function BreakdownTable({
  rows,
  fmt,
  footer,
}: {
  rows: { label: string; count: number; total: number }[];
  fmt: Intl.NumberFormat;
  footer?: { label: string; total: number };
}) {
  if (rows.length === 0) {
    return <p className="text-muted-foreground text-sm">Sin datos.</p>;
  }
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Concepto</TableHead>
            <TableHead className="text-right">Cant.</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.label}>
              <TableCell className="font-medium">{r.label}</TableCell>
              <TableCell className="text-right">{r.count}</TableCell>
              <TableCell className="text-right">{fmt.format(r.total)}</TableCell>
            </TableRow>
          ))}
          {footer && (
            <TableRow>
              <TableCell colSpan={2} className="text-right font-semibold">
                {footer.label}
              </TableCell>
              <TableCell className="text-right font-semibold">
                {fmt.format(footer.total)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
