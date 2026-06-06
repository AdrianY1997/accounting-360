import { eq } from "drizzle-orm";
import { db } from "@/db";
import { salonSettings } from "@/db/schema";
import { SaleForm } from "@/components/sales/sale-form";
import { listClients } from "@/services/clients";
import { listServices } from "@/services/catalog";
import { listSalonStaff } from "@/services/sales";
import { requireSalonContext } from "@/lib/tenant";

export default async function NewSalePage() {
  const ctx = await requireSalonContext();
  const [clients, services, staff, settings] = await Promise.all([
    listClients(ctx),
    listServices(ctx),
    listSalonStaff(ctx),
    db.query.salonSettings.findFirst({
      where: eq(salonSettings.teamId, ctx.salonId),
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <h1 className="text-2xl font-semibold">Nueva venta</h1>
      <SaleForm
        clients={clients.map((c) => ({
          id: c.id,
          fullName: c.fullName,
          type: c.type,
        }))}
        services={services
          .filter((s) => s.active)
          .map((s) => ({
            id: s.id,
            name: s.name,
            price: s.price,
            resellerPrice: s.resellerPrice,
            minPrice: s.minPrice,
            measureType: s.measureType,
            priceMode: s.priceMode,
            durationMinutes: s.durationMinutes,
          }))}
        staff={staff}
        taxRate={Number(settings?.taxRate ?? 0)}
        currency={settings?.currency ?? "USD"}
      />
    </div>
  );
}
