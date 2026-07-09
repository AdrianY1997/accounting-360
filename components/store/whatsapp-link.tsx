import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

/** wa.me only accepts digits — strip +, spaces, dashes. */
function waHref(phone: string, message?: string) {
  const digits = phone.replace(/\D/g, "");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${text}`;
}

/** "¿Tienes dudas? Escríbenos por WhatsApp" block for the item detail page. */
export function WhatsappCta({
  phone,
  message,
}: {
  phone: string | null;
  message?: string;
}) {
  if (!phone) return null;
  return (
    <div className="bg-muted/50 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4">
      <div>
        <p className="font-medium">¿Tienes dudas?</p>
        <p className="text-muted-foreground text-sm">
          Escríbenos por WhatsApp y te ayudamos.
        </p>
      </div>
      <Button asChild className="bg-green-600 text-white hover:bg-green-700">
        <a href={waHref(phone, message)} target="_blank" rel="noopener">
          <MessageCircle className="size-4" />
          Escríbenos por WhatsApp
        </a>
      </Button>
    </div>
  );
}

/** Floating WhatsApp button — mounted in the store layout. */
export function WhatsappFloat({ phone }: { phone: string | null }) {
  if (!phone) return null;
  return (
    <a
      href={waHref(phone)}
      target="_blank"
      rel="noopener"
      aria-label="Escríbenos por WhatsApp"
      className="fixed bottom-4 right-4 z-20 grid size-12 place-items-center rounded-full bg-green-600 text-white shadow-lg transition-transform hover:scale-105 print:hidden"
    >
      <MessageCircle className="size-6" />
    </a>
  );
}
