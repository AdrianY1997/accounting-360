import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getOpenSession, sessionSummary } from "@/services/cash";
import { listSales } from "@/services/sales";
import { salonReport } from "@/services/reports";
import { dayRange, monthRange } from "@/lib/period";
import { requireSalonContext } from "@/lib/tenant";

export default async function DashboardPage() {
  const ctx = await requireSalonContext();
  const today = dayRange();
  const month = monthRange();

  const [todayRep, monthRep, sales, openSession, settings] = await Promise.all([
    salonReport(ctx, today.from, today.to),
    salonReport(ctx, month.from, month.to),
    listSales(ctx),
    getOpenSession(ctx),
    db.query.salonSettings.findFirst({
      where: eq(salonSettings.teamId, ctx.salonId),
    }),
  ]);
  const fmt = new Intl.NumberFormat("es", {
    style: "currency",
    currency: settings?.currency ?? "USD",
  });

  const pending = sales.filter(
    (s) => s.paymentStatus === "pending" || s.paymentStatus === "partial",
  );
  const outstanding = pending.reduce(
    (acc, s) => acc + (Number(s.total) - Number(s.paid)),
    0,
  );
  const caja = openSession ? await sessionSummary(ctx, openSession) : null;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <h1 className="text-2xl font-semibold">Panel</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="Ventas hoy" value={fmt.format(todayRep.totals.income)} hint={`${todayRep.totals.salesCount} ventas`} href="/sales" />
        <Stat title="Ventas del mes" value={fmt.format(monthRep.totals.income)} hint={`${monthRep.totals.salesCount} ventas`} href="/reports" />
        <Stat
          title="Utilidad del mes"
          value={fmt.format(monthRep.totals.profit)}
          hint="ingresos − gastos − comisiones"
          valueClass={monthRep.totals.profit < 0 ? "text-destructive" : "text-green-600"}
          href="/reports"
        />
        <Stat
          title="Por cobrar"
          value={fmt.format(outstanding)}
          hint={`${pending.length} ventas pendientes`}
          href="/sales"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Caja
              <Link href="/cash" className="text-muted-foreground text-sm font-normal hover:underline">
                Ver
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {caja ? (
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado</span>
                  <span className="text-green-600">Abierta</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Esperado en caja</span>
                  <span className="font-medium">{fmt.format(Number(caja.expected))}</span>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">
                No hay caja abierta.{" "}
                <Link href="/cash" className="text-foreground hover:underline">
                  Abrir caja
                </Link>
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-base">
              Top servicios del mes
              <Link href="/reports" className="text-muted-foreground text-sm font-normal hover:underline">
                Ver
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            {monthRep.byService.length === 0 ? (
              <p className="text-muted-foreground">Sin ventas este mes.</p>
            ) : (
              <ul className="space-y-1">
                {monthRep.byService.slice(0, 5).map((s) => (
                  <li key={s.name} className="flex justify-between">
                    <span>{s.name}</span>
                    <span className="font-medium">{fmt.format(s.total)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  hint,
  href,
  valueClass,
}: {
  title: string;
  value: string;
  hint?: string;
  href?: string;
  valueClass?: string;
}) {
  const inner = (
    <Card className={href ? "transition-colors hover:bg-accent/40" : undefined}>
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
  return href ? <Link href={href}>{inner}</Link> : inner;
}
