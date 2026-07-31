"use client";

import { usePathname } from "next/navigation";
import { SiWhatsapp } from "@icons-pack/react-simple-icons";
import { MessageCircle } from "lucide-react";

/** wa.me only accepts digits — strip +, spaces, dashes. */
export function waHref(phone: string, message?: string) {
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
    <div className="bg-pink-100 border border-pink-500 rounded-lg p-4">
      <a href={waHref(phone, message)} target="_blank" rel="noopener">
        <div className="flex gap-4 items-center">
          <SiWhatsapp className="size-8" />
          <div className="text-sm">
            <p className="font-medium">¿Tienes dudas?</p>
            <p className="text-muted-foreground text-sm">
              Escríbenos por WhatsApp y te ayudamos.
            </p>
          </div>
        </div>
      </a>
    </div>
  );
}

/**
 * Floating WhatsApp button — mounted in the store layout. Hidden on
 * item-detail routes (`/store/:salonId/:itemId`, `/s/:token/:itemId` — both 3
 * path segments): those pages have their own fixed "Pedir por WhatsApp" bar
 * in the same bottom-right band, and the two would overlap on short screens.
 */
export function WhatsappFloat({ phone }: { phone: string | null }) {
  const pathname = usePathname();
  const isItemDetail = pathname.split("/").filter(Boolean).length === 3;
  if (!phone || isItemDetail) return null;
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
