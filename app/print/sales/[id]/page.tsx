import { eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { client as clientTable, organization, salonSettings, team } from "@/db/schema";
import { PrintButton } from "@/components/print-button";
import { getSale } from "@/services/sales";
import { requireSalonContext } from "@/lib/tenant";
import { paymentMethodLabels, type PaymentMethod } from "@/lib/validations/payment";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSalonContext();
  const { id } = await params;
  const data = await getSale(ctx, id);
  if (!data) notFound();
  const { sale, items, payments, paid, balance } = data;

  const [org, salon, settings, saleClient] = await Promise.all([
    db.query.organization.findFirst({
      where: eq(organization.id, ctx.organizationId),
    }),
    db.query.team.findFirst({ where: eq(team.id, ctx.salonId) }),
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
    <main className="mx-auto max-w-md space-y-4 p-6 text-sm">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/sales/${sale.id}`} className="text-muted-foreground hover:underline">
          ← Volver
        </Link>
        <PrintButton />
      </div>

      <header className="space-y-0.5 text-center">
        {settings?.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={settings.logoUrl}
            alt={org?.name ?? "logo"}
            className="mx-auto mb-1 h-12 w-auto object-contain"
          />
        )}
        <h1 className="text-lg font-semibold">{org?.name ?? "salon360"}</h1>
        {salon && <p>{salon.name}</p>}
        {settings?.address && <p className="text-muted-foreground">{settings.address}</p>}
        {settings?.phone && <p className="text-muted-foreground">{settings.phone}</p>}
      </header>

      <div className="border-y py-2">
        <p>{dateFmt.format(new Date(sale.createdAt))}</p>
        <p>Cliente: {saleClient?.fullName ?? "Consumidor final"}</p>
        <p className="text-muted-foreground">Ticket #{sale.id.slice(0, 8)}</p>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b text-left">
            <th className="py-1">Descripción</th>
            <th className="py-1 text-right">Cant</th>
            <th className="py-1 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id} className="align-top">
              <td className="py-1">{it.description}</td>
              <td className="py-1 text-right">{it.quantity}</td>
              <td className="py-1 text-right">{fmt.format(Number(it.lineTotal))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-0.5 border-t pt-2">
        <Row label="Subtotal" value={fmt.format(Number(sale.subtotal))} />
        <Row
          label={`Impuesto (${(Number(sale.taxRate) * 100).toFixed(2)}%)`}
          value={fmt.format(Number(sale.taxAmount))}
        />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{fmt.format(Number(sale.total))}</span>
        </div>
        <Row label="Pagado" value={fmt.format(Number(paid))} />
        <Row label="Saldo" value={fmt.format(Number(balance))} />
      </div>

      {payments.length > 0 && (
        <div className="space-y-0.5 border-t pt-2">
          {payments.map((p) => (
            <Row
              key={p.id}
              label={paymentMethodLabels[p.method as PaymentMethod] ?? p.method}
              value={fmt.format(Number(p.amount))}
            />
          ))}
        </div>
      )}

      <p className="border-t pt-3 text-center text-muted-foreground">
        ¡Gracias por su visita!
      </p>
    </main>
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
