import { eq } from "drizzle-orm";
import Link from "next/link";
import { Plus } from "lucide-react";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
import { EmptyState } from "@/components/empty-state";
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
import { listSales } from "@/services/sales";
import { requireSalonContext } from "@/lib/tenant";

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

export default async function SalesPage() {
  const ctx = await requireSalonContext();
  const [sales, settings] = await Promise.all([
    listSales(ctx),
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

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ventas</h1>
        <Button asChild>
          <Link href="/sales/new">
            <Plus className="size-4" />
            Nueva venta
          </Link>
        </Button>
      </div>

      {sales.length === 0 ? (
        <EmptyState
          title="Aún no hay ventas"
          description="Registra tu primera venta para empezar a facturar."
          action={
            <Button asChild>
              <Link href="/sales/new">
                <Plus className="size-4" />
                Nueva venta
              </Link>
            </Button>
          }
        />
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <Link href={`/sales/${s.id}`} className="hover:underline">
                      {dateFmt.format(new Date(s.createdAt))}
                    </Link>
                  </TableCell>
                  <TableCell>{s.clientName ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[s.paymentStatus]}>
                      {statusLabel[s.paymentStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {fmt.format(Number(s.total))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
