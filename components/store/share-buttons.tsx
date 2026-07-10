"use client";

import { Button } from "@/components/ui/button";
import {
  SiFacebook,
  SiFacebookHex,
  SiWhatsapp,
  SiWhatsappHex,
} from "@icons-pack/react-simple-icons";
import { Link2 } from "lucide-react";
import { toast } from "sonner";
import { WhatsappCta } from "./whatsapp-link";

/**
 * "Compartir producto" row: WhatsApp / Facebook share intents + copy link.
 * Uses the current URL at click time — no config needed. (Instagram omitted:
 * it has no web share intent.)
 */
export function ShareButtons({
  whatsapp,
  itemName,
}: {
  whatsapp: string | null;
  itemName: string;
}) {
  const share = (build: (url: string) => string) => () => {
    window.open(build(window.location.href), "_blank", "noopener");
  };

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado");
    } catch {
      toast.error("No se pudo copiar el enlace");
    }
  }

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4 shadow">
      <p className="text-sm font-medium">Compartir producto</p>
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col items-center gap-1">
          <Button
            className="size-auto p-2.5 rounded-full aspect-square"
            style={{
              backgroundColor: SiWhatsappHex,
            }}
            type="button"
            onClick={share(
              (url) =>
                `https://wa.me/?text=${encodeURIComponent(`${itemName} — ${url}`)}`,
            )}
          >
            <SiWhatsapp className="size-6" />
          </Button>
          <p className="text-sm text-neutral-500">WhatsApp</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            className="size-auto p-2.5 rounded-full aspect-square"
            style={{
              backgroundColor: SiFacebookHex,
            }}
            type="button"
            onClick={share(
              (url) =>
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            )}
          >
            <SiFacebook className="size-6" />
          </Button>
          <p className="text-sm text-neutral-500">Facebook</p>
        </div>
        <div className="flex flex-col items-center gap-1">
          <Button
            className="size-auto p-2.5 rounded-full aspect-square bg-neutral-200"
            type="button"
            onClick={copy}
          >
            <Link2 className="size-6 text-neutral-500" />
          </Button>
          <p className="text-sm text-neutral-500">Copiar Enlace</p>
        </div>
      </div>

      <WhatsappCta phone={whatsapp} message={`Hola, me interesa ${itemName}`} />
    </div>
  );
}
