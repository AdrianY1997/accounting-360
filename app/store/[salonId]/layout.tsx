import { notFound } from "next/navigation";
import { StoreHeader } from "@/components/store/store-header";
import { publicStore } from "@/services/public";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ salonId: string }>;
}) {
  const { salonId } = await params;
  const store = await publicStore(salonId);
  if (!store) notFound();

  return (
    <div className="flex min-h-svh flex-col bg-neutral-100">
      <StoreHeader company={store.company} salon={store.salon} salonId={salonId} />
      <main className="mx-auto w-full max-w-6xl flex-1 p-4 bg-white shadow my-4 rounded-lg">{children}</main>
      <footer className="text-muted-foreground pb-6 pt-2 text-center text-xs">
        Catálogo en línea · {store.company}
      </footer>
    </div>
  );
}
