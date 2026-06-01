import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { client as clientTable, salonSettings } from "@/db/schema";
import { ResourceDeleteButton } from "@/components/resource-delete-button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSale } from "@/services/sales";
import { requireSalonContext } from "@/lib/tenant";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSalonContext();
  const { id } = await params;
  const data = await getSale(ctx, id);
  if (!data) notFound();
  const { sale, items } = data;

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
          <Badge variant={sale.status === "void" ? "destructive" : "secondary"}>
            {sale.status === "void" ? "Anulada" : "Completada"}
          </Badge>
          {sale.status !== "void" && (
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
                <TableCell className="text-right">{it.quantity}</TableCell>
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
      </div>

      {sale.notes && (
        <p className="text-muted-foreground text-sm">Notas: {sale.notes}</p>
      )}
    </div>
  );
}
