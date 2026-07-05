import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  PublicItem,
  PublicVariant,
  PublicVariantImage,
} from "@/services/public";

/**
 * Detail-page side panel summarizing the current selection: variant, active
 * photo, unit price and availability. Informational only — no cart.
 */
export function SelectionSummary({
  item,
  variant,
  photo,
  currency,
}: {
  item: PublicItem;
  variant?: PublicVariant;
  photo?: PublicVariantImage;
  currency: string;
}) {
  const fmt = new Intl.NumberFormat("es", { style: "currency", currency });
  const price = variant ? variant.price : item.price;
  const stock = variant ? variant.stock : item.totalStock;

  let availability = "Disponible";
  if (item.tracksStock) {
    if (photo?.stock != null) {
      availability =
        photo.stock === 0 ? "Foto agotada" : `${photo.stock} de esta foto`;
    } else {
      availability = stock === 0 ? "Agotado" : `${stock} disponibles`;
    }
  }

  return (
    <Card className="lg:sticky lg:top-20">
      <CardHeader>
        <CardTitle className="text-base">Tu selección</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {photo && (
          <div className="bg-muted mx-auto size-24 overflow-hidden rounded-md border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={item.name}
              className={`size-full object-cover ${photo.stock === 0 ? "opacity-40" : ""}`}
            />
          </div>
        )}
        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Variante</dt>
            <dd className="text-right font-medium">
              {variant ? variant.name : item.variants.length > 0 ? "Todas" : "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Precio</dt>
            <dd className="text-right font-semibold">
              {!variant && item.variants.length > 1 ? "desde " : ""}
              {fmt.format(Number(price))}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt className="text-muted-foreground">Disponibilidad</dt>
            <dd
              className={`text-right font-medium ${
                item.tracksStock && (stock === 0 || photo?.stock === 0)
                  ? "text-destructive"
                  : ""
              }`}
            >
              {availability}
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
