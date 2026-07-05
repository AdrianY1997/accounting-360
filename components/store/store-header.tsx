import Link from "next/link";
import { SearchInput } from "@/components/search-input";

/** Sticky public-store header: company "logo" link, salon name and search. */
export function StoreHeader({
  company,
  salon,
  salonId,
}: {
  company: string;
  salon: string;
  salonId: string;
}) {
  return (
    <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href={`/store/${salonId}`} className="min-w-0">
          <span className="text-primary block truncate text-lg font-bold leading-tight">
            {company}
          </span>
          <span className="text-muted-foreground block truncate text-xs">
            {salon}
          </span>
        </Link>
        <div className="ml-auto w-full sm:w-auto">
          <SearchInput
            placeholder="Buscar productos…"
            shallow
            basePath={`/store/${salonId}`}
          />
        </div>
      </div>
    </header>
  );
}
