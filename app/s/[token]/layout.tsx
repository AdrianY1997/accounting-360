import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/store/store-header";
import { WhatsappFloat } from "@/components/store/whatsapp-link";
import { TooltipProvider } from "@/components/ui/tooltip";
import { publicStoreByResellerToken } from "@/services/public";

/**
 * Priceless storefront shared by a reseller (`/s/<token>`). Same chrome as
 * the public store, but prices are stripped server-side and the WhatsApp
 * contact is the reseller's phone (button hidden without one). The salonId
 * never appears in any URL here.
 */
export default async function ResellerStoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const store = await publicStoreByResellerToken(token);
  if (!store) notFound();

  return (
    <TooltipProvider>
      <div className="flex min-h-svh flex-col bg-neutral-100">
        <StoreHeader
          company={store.company}
          salon={store.salon}
          salonId=""
          basePath={`/s/${token}`}
        />
        <main className="mx-auto w-full max-w-6xl min-w-0 flex-1 my-4 px-2 sm:px-4">
          {children}
        </main>
        <footer className="text-muted-foreground pb-6 pt-2 text-center text-xs">
          Catálogo en línea · {store.company}
        </footer>
        <WhatsappFloat phone={store.whatsapp} />
      </div>
    </TooltipProvider>
  );
}
