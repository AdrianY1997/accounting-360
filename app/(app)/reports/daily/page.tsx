import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
import { DayFilter } from "@/components/day-filter";
import { Badge } from "@/components/ui/badge";
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
import { listSessions } from "@/services/cash";
import { salonReport } from "@/services/reports";
import { can } from "@/lib/roles";
import { dayRange, toDateInput } from "@/lib/period";
import { requireSalonContext } from "@/lib/tenant";
import {
  paymentMethodLabels,
  type PaymentMethod,
} from "@/lib/validations/payment";

export default async function DailyClosePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const ctx = await requireSalonContext();
  if (!can(ctx, "reports:view")) redirect("/dashboard");

  const sp = await searchParams;
  const base = sp.date ? new Date(`${sp.date}T12:00:00`) : new Date();
  const { from, to } = dayRange(base);

  const [report, sessions, settings] = await Promise.all([
    salonReport(ctx, from, to),
    listSessions(ctx),
    db.query.salonSettings.findFirst({
      where: eq(salonSettings.teamId, ctx.salonId),
    }),
  ]);
  const fmt = new Intl.NumberFormat("es", {
    style: "currency",
    currency: settings?.currency ?? "USD",
  });
  const dateFmt = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const { totals } = report;
  const daySessions = sessions.filter((s) => {
    const t = new Date(s.openedAt).getTime();
    return t >= from.getTime() && t <= to.getTime();
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Cierre diario</h1>
        <DayFilter date={toDateInput(from)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Ventas" value={fmt.format(totals.income)} hint={`${totals.salesCount} ventas`} />
        <Stat title="Cobrado" value={fmt.format(totals.collected)} />
        <Stat title="Gastos" value={fmt.format(totals.expenses)} />
        <Stat
          title="Utilidad"
          value={fmt.format(totals.profit)}
          valueClass={totals.profit < 0 ? "text-destructive" : "text-green-600"}
        />
      </div>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Cobrado por método</h2>
        {report.byMethod.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin pagos.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Pagos</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.byMethod.map((m) => (
                  <TableRow key={m.method}>
                    <TableCell>
                      {paymentMethodLabels[m.method as PaymentMethod] ?? m.method}
                    </TableCell>
                    <TableCell className="text-right">{m.count}</TableCell>
                    <TableCell className="text-right">{fmt.format(m.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Cajas del día</h2>
        {daySessions.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin cajas abiertas este día.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Esperado</TableHead>
                  <TableHead className="text-right">Contado</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {daySessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{dateFmt.format(new Date(s.openedAt))}</TableCell>
                    <TableCell>
                      <Badge variant={s.status === "closed" ? "default" : "secondary"}>
                        {s.status === "closed" ? "Cerrada" : "Abierta"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {s.expectedAmount ? fmt.format(Number(s.expectedAmount)) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.countedAmount ? fmt.format(Number(s.countedAmount)) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {s.difference ? fmt.format(Number(s.difference)) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
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
