import { eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
import { CloseSessionDialog } from "@/components/cash/close-session-dialog";
import { MovementDialog } from "@/components/cash/movement-dialog";
import { OpenSessionForm } from "@/components/cash/open-session-form";
import { ResourceDeleteButton } from "@/components/resource-delete-button";
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
import {
  getOpenSession,
  listMovements,
  listSessions,
  sessionSummary,
} from "@/services/cash";
import { requireSalonContext } from "@/lib/tenant";
import { movementTypeLabels, type MovementType } from "@/lib/validations/cash";

export default async function CashPage() {
  const ctx = await requireSalonContext();
  const [open, sessions, settings] = await Promise.all([
    getOpenSession(ctx),
    listSessions(ctx),
    db.query.salonSettings.findFirst({
      where: eq(salonSettings.teamId, ctx.salonId),
    }),
  ]);
  const currency = settings?.currency ?? "USD";
  const fmt = new Intl.NumberFormat("es", { style: "currency", currency });
  const dateFmt = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const [summary, movements] = open
    ? await Promise.all([sessionSummary(ctx, open), listMovements(ctx, open.id)])
    : [null, []];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <h1 className="text-2xl font-semibold">Caja</h1>

      {open && summary ? (
        <section className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>
                Caja abierta{" "}
                <span className="text-muted-foreground text-sm font-normal">
                  {dateFmt.format(new Date(open.openedAt))}
                </span>
              </CardTitle>
              <div className="flex gap-2">
                <MovementDialog sessionId={open.id} />
                <CloseSessionDialog
                  sessionId={open.id}
                  expected={summary.expected}
                  currency={currency}
                />
              </div>
            </CardHeader>
            <CardContent className="grid max-w-sm gap-1 text-sm">
              <Row label="Saldo inicial" value={fmt.format(Number(summary.opening))} />
              <Row
                label="Pagos en efectivo"
                value={fmt.format(Number(summary.cashPayments))}
              />
              <Row label="Ingresos" value={fmt.format(Number(summary.movementsIn))} />
              <Row label="Egresos" value={`-${fmt.format(Number(summary.movementsOut))}`} />
              <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
                <span>Esperado en caja</span>
                <span>{fmt.format(Number(summary.expected))}</span>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="mb-2 text-lg font-semibold">Movimientos</h2>
            {movements.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin movimientos.</p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((m) => (
                      <TableRow key={m.id}>
                        <TableCell>{dateFmt.format(new Date(m.createdAt))}</TableCell>
                        <TableCell>
                          <Badge variant={m.type === "in" ? "secondary" : "outline"}>
                            {movementTypeLabels[m.type as MovementType] ?? m.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{m.description}</TableCell>
                        <TableCell className="text-right">
                          {fmt.format(Number(m.amount))}
                        </TableCell>
                        <TableCell className="text-right">
                          <ResourceDeleteButton
                            endpoint={`/api/cash-movements/${m.id}`}
                            name="este movimiento"
                            successMessage="Movimiento eliminado"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>
      ) : (
        <OpenSessionForm />
      )}

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Historial</h2>
        {sessions.filter((s) => s.status === "closed").length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin cajas cerradas.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Apertura</TableHead>
                  <TableHead>Cierre</TableHead>
                  <TableHead className="text-right">Esperado</TableHead>
                  <TableHead className="text-right">Contado</TableHead>
                  <TableHead className="text-right">Diferencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions
                  .filter((s) => s.status === "closed")
                  .map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        <Link href={`/cash/${s.id}`} className="hover:underline">
                          {dateFmt.format(new Date(s.openedAt))}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {s.closedAt ? dateFmt.format(new Date(s.closedAt)) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt.format(Number(s.expectedAmount ?? 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt.format(Number(s.countedAmount ?? 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        {fmt.format(Number(s.difference ?? 0))}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
