import { SettingsForm } from "@/components/settings/settings-form";
import { getSettings } from "@/services/settings";
import { requireSalonContext } from "@/lib/tenant";

export default async function SettingsPage() {
  const ctx = await requireSalonContext();
  const settings = await getSettings(ctx);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-semibold">Configuración</h1>
      <SettingsForm settings={settings} />
    </div>
  );
}
