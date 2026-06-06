import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Printer } from "lucide-react";
import { db } from "@/db";
import { client as clientTable, salonSettings } from "@/db/schema";
import { PaymentDialog } from "@/components/sales/payment-dialog";
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
import { getSale } from "@/services/sales";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";
import { paymentMethodLabels, type PaymentMethod } from "@/lib/validations/payment";

const statusLabel: Record<string, string> = {
  pending: "Pendiente",
  partial: "Parcial",
  paid: "Pagada",
  void: "Anulada",
};
const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "outline",
  partial: "secondary",
  paid: "default",
  void: "destructive",
};

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSalonContext();
  const { id } = await params;
  const data = await getSale(ctx, id);
  if (!data) notFound();
  const { sale, items, payments, paid, balance, paymentStatus } = data;

  const [settings, saleClient] = await Promise.all([
    db.query.salonSettings.findFirst({
      where: eq(salonSettings.teamId, ctx.salonId),
    }),
    sale.clientId
      ? db.query.client.findFirst({ where: eq(clientTable.id, sale.clientId) })
      : Promise.resolve(undefined),
  ]);
  const fmt = new Intl.NumberFormat("es", {
    style: "currency",
    currency: settings?.currency ?? "USD",
  });
  const dateFmt = new Intl.DateTimeFormat("es", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Venta</h1>
          <p className="text-muted-foreground text-sm">
            {dateFmt.format(new Date(sale.createdAt))}
          </p>
          <p className="text-sm">Cliente: {saleClient?.fullName ?? "—"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/print/sales/${sale.id}`}>
              <Printer className="size-4" />
              Recibo
            </Link>
          </Button>
          <Badge variant={statusVariant[paymentStatus]}>
            {statusLabel[paymentStatus]}
          </Badge>
          {sale.status !== "void" && can(ctx.role, "sales:void") && (
            <ResourceDeleteButton
              endpoint={`/api/sales/${sale.id}`}
              name="esta venta"
              successMessage="Venta anulada"
            />
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descripción</TableHead>
              <TableHead>Staff</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Cant.</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((it) => (
              <TableRow key={it.id}>
                <TableCell className="font-medium">{it.description}</TableCell>
                <TableCell>{it.staffName ?? "—"}</TableCell>
                <TableCell className="text-right">
                  {fmt.format(Number(it.unitPrice))}
                </TableCell>
                <TableCell className="text-right">
                  {it.measureType === "duration"
                    ? `${it.durationMinutes ?? 0} min`
                    : Number(it.quantity)}
                </TableCell>
                <TableCell className="text-right">
                  {fmt.format(Number(it.lineTotal))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="ml-auto w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{fmt.format(Number(sale.subtotal))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">
            Impuesto ({(Number(sale.taxRate) * 100).toFixed(2)}%)
          </span>
          <span>{fmt.format(Number(sale.taxAmount))}</span>
        </div>
        <div className="flex justify-between border-t pt-1 font-semibold">
          <span>Total</span>
          <span>{fmt.format(Number(sale.total))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Pagado</span>
          <span>{fmt.format(Number(paid))}</span>
        </div>
        <div className="flex justify-between font-medium">
          <span>Saldo</span>
          <span>{fmt.format(Number(balance))}</span>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Pagos</h2>
          {sale.status !== "void" && Number(balance) > 0 && (
            <PaymentDialog saleId={sale.id} defaultAmount={balance} />
          )}
        </div>
        {payments.length === 0 ? (
          <p className="text-muted-foreground text-sm">Sin pagos registrados.</p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {dateFmt.format(new Date(p.paidAt))}
                    </TableCell>
                    <TableCell>
                      {paymentMethodLabels[p.method as PaymentMethod] ??
                        p.method}
                    </TableCell>
                    <TableCell className="text-right">
                      {fmt.format(Number(p.amount))}
                    </TableCell>
                    <TableCell className="text-right">
                      <ResourceDeleteButton
                        endpoint={`/api/payments/${p.id}`}
                        name="este pago"
                        successMessage="Pago eliminado"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {sale.notes && (
        <p className="text-muted-foreground text-sm">Notas: {sale.notes}</p>
      )}
    </div>
  );
}
