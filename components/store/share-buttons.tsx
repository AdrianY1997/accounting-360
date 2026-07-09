"use client";

import { Link2, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * "Compartir producto" row: WhatsApp / Facebook share intents + copy link.
 * Uses the current URL at click time — no config needed. (Instagram omitted:
 * it has no web share intent.)
 */
export function ShareButtons({ itemName }: { itemName: string }) {
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
    <div className="space-y-2">
      <p className="text-sm font-medium">Compartir producto</p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={share(
            (url) =>
              `https://wa.me/?text=${encodeURIComponent(`${itemName} — ${url}`)}`,
          )}
        >
          <MessageCircle className="size-4" />
          WhatsApp
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={share(
            (url) =>
              `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
          )}
        >
          <Share2 className="size-4" />
          Facebook
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={copy}>
          <Link2 className="size-4" />
          Copiar enlace
        </Button>
      </div>
    </div>
  );
}
