/**
 * AI-image disclosure per catalog photo (`service_image.ai_kind`). Shared by
 * the admin uploader and the public store badges/tooltips.
 */
export const aiKinds = ["reference", "generated"] as const;
export type AiKind = (typeof aiKinds)[number];

export const aiKindLabels: Record<AiKind, string> = {
  reference: "Referencia",
  generated: "Generada",
};

/** Tooltip / disclosure text shown to store visitors. */
export const aiKindDisclosures: Record<AiKind, string> = {
  reference:
    "Imagen de referencia generada con IA — el producto real puede variar",
  generated: "Imagen generada con IA",
};

export function isAiKind(v: unknown): v is AiKind {
  return v === "reference" || v === "generated";
}
