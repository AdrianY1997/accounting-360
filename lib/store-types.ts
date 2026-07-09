/**
 * Store-type registry: which extra product fields a salón's storefront asks
 * for and displays. Plain TS — importable from server and client. `text`
 * attributes render as label:value rows on the item detail page; `longtext`
 * attributes render as their own tab. Attribute values live in
 * `service.attributes` (jsonb) keyed by `key`; switching store type never
 * deletes stored values — it only changes what is rendered/edited.
 */
export type StoreAttributeKind = "text" | "longtext";

export type StoreAttributeDef = {
  /** Stable storage key inside `service.attributes`. */
  key: string;
  label: string;
  kind: StoreAttributeKind;
  placeholder?: string;
};

export type StoreTypeDef = {
  id: string;
  label: string;
  attributes: StoreAttributeDef[];
};

export const storeTypes: StoreTypeDef[] = [
  {
    id: "generic",
    label: "Genérica",
    attributes: [
      {
        key: "entrega",
        label: "Entrega",
        kind: "text",
        placeholder: "2 a 3 días hábiles",
      },
    ],
  },
  {
    id: "ropa",
    label: "Ropa / Moda",
    attributes: [
      { key: "material", label: "Material", kind: "text", placeholder: "Tela fría" },
      {
        key: "medidas",
        label: "Medidas",
        kind: "text",
        placeholder: "Largo 95 cm / Ancho 60 cm",
      },
      {
        key: "entrega",
        label: "Entrega",
        kind: "text",
        placeholder: "2 a 3 días hábiles",
      },
      {
        key: "cuidados",
        label: "Cuidados",
        kind: "longtext",
        placeholder: "Lavar a mano con agua fría…",
      },
    ],
  },
  {
    id: "belleza",
    label: "Belleza / Salón",
    attributes: [
      {
        key: "contenido",
        label: "Contenido / Tamaño",
        kind: "text",
        placeholder: "250 ml",
      },
      {
        key: "entrega",
        label: "Entrega",
        kind: "text",
        placeholder: "2 a 3 días hábiles",
      },
      {
        key: "modo_uso",
        label: "Modo de uso",
        kind: "longtext",
        placeholder: "Aplicar sobre el cabello húmedo…",
      },
    ],
  },
];

export const storeTypeIds = storeTypes.map((t) => t.id) as [
  string,
  ...string[],
];

export function getStoreType(id: string | null | undefined): StoreTypeDef {
  return storeTypes.find((t) => t.id === id) ?? storeTypes[0];
}
