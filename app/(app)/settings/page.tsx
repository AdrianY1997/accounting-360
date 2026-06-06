import { redirect } from "next/navigation";
import { CreateSalonDialog } from "@/components/settings/create-salon-dialog";
import { SettingsForm } from "@/components/settings/settings-form";
import { getSettings } from "@/services/settings";
import { listSalons } from "@/services/salons";
import { can } from "@/lib/roles";
import { requireSalonContext } from "@/lib/tenant";

export default async function SettingsPage() {
  const ctx = await requireSalonContext();
  if (!can(ctx, "settings:manage")) redirect("/dashboard");
  const [settings, salons] = await Promise.all([
    getSettings(ctx),
    listSalons(ctx),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <SettingsForm settings={settings} />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Salones</h2>
            <p className="text-muted-foreground text-sm">
              {salons.length} sede{salons.length === 1 ? "" : "s"} en la empresa.
            </p>
          </div>
          <CreateSalonDialog />
        </div>
        <ul className="divide-y rounded-md border">
          {salons.map((s) => (
            <li key={s.id} className="px-4 py-2 text-sm">
              {s.name}
              {s.id === ctx.salonId && (
                <span className="text-muted-foreground"> · activo</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
