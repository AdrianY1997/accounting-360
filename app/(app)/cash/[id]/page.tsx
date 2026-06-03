import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
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
import { getSession } from "@/services/cash";
import { requireSalonContext } from "@/lib/tenant";
import { movementTypeLabels, type MovementType } from "@/lib/validations/cash";

export default async function CashSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSalonContext();
  const { id } = await params;
  const data = await getSession(ctx, id);
  if (!data) notFound();
  const { session, movements, summary } = data;

  const settings = await db.query.salonSettings.findFirst({
    where: eq(salonSettings.teamId, ctx.salonId),
  });
  const fmt = new Intl.NumberFormat("es", {
    style: "currency",
    currency: settings?.currency ?? "USD",
  });
  const dateFmt = new Intl.DateTimeFormat("es", {
    dateStyle: "long",
    timeStyle: "short",
  });
  const closed = session.status === "closed";
  const difference = Number(session.difference ?? 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Caja</h1>
          <p className="text-muted-foreground text-sm">
            Apertura: {dateFmt.format(new Date(session.openedAt))}
          </p>
          {session.closedAt && (
            <p className="text-muted-foreground text-sm">
              Cierre: {dateFmt.format(new Date(session.closedAt))}
            </p>
          )}
        </div>
        <Badge variant={closed ? "default" : "secondary"}>
          {closed ? "Cerrada" : "Abierta"}
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen</CardTitle>
        </CardHeader>
        <CardContent className="grid max-w-sm gap-1 text-sm">
          <Row label="Saldo inicial" value={fmt.format(Number(summary.opening))} />
          <Row label="Pagos en efectivo" value={fmt.format(Number(summary.cashPayments))} />
          <Row label="Ingresos" value={fmt.format(Number(summary.movementsIn))} />
          <Row label="Egresos" value={`-${fmt.format(Number(summary.movementsOut))}`} />
          <div className="mt-1 flex justify-between border-t pt-1 font-semibold">
            <span>Esperado</span>
            <span>
              {fmt.format(Number(session.expectedAmount ?? summary.expected))}
            </span>
          </div>
          {closed && (
            <>
              <Row label="Contado" value={fmt.format(Number(session.countedAmount ?? 0))} />
              <div className="flex justify-between font-medium">
                <span>Diferencia</span>
                <span
                  className={
                    difference === 0
                      ? ""
                      : difference > 0
                        ? "text-green-600"
                        : "text-destructive"
                  }
                >
                  {fmt.format(difference)}
                </span>
              </div>
            </>
          )}
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {session.notes && (
        <p className="text-muted-foreground text-sm">Notas: {session.notes}</p>
      )}
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
