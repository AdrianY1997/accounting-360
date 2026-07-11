/**
 * Suggested price tiers from a cost price. Derived from the salón's real
 * pricing (e.g. costo 13000 → sugerido 20000, intermediario 17000, mínimo
 * 18000):
 *
 * - sugerido = costo × 1.5, rounded UP to a "nice" step (one order of
 *   magnitude below the price: 19500 → 20000, 19.5 → 20),
 * - intermediario = 85% of sugerido,
 * - mínimo = 90% of sugerido.
 *
 * Suggestions only — every field stays editable after being filled.
 */
const MARKUP = 1.5;
const RESELLER_PCT = 0.85;
const MIN_PCT = 0.9;

/** Rounding step one order of magnitude below the value (currency-agnostic). */
function niceStep(value: number): number {
  return Math.pow(10, Math.max(0, Math.floor(Math.log10(value)) - 1));
}

export type SuggestedTiers = {
  price: number;
  resellerPrice: number;
  minPrice: number;
};

/** Intermediario (85%) and mínimo (90%) derived from a retail price. */
export function tiersFromPrice(price: number): SuggestedTiers | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  const step = niceStep(price);
  return {
    price,
    resellerPrice: Math.round((price * RESELLER_PCT) / step) * step,
    minPrice: Math.round((price * MIN_PCT) / step) * step,
  };
}

export function suggestPrices(cost: number): SuggestedTiers | null {
  if (!Number.isFinite(cost) || cost <= 0) return null;
  const raw = cost * MARKUP;
  const step = niceStep(raw);
  return tiersFromPrice(Math.ceil(raw / step) * step);
}
