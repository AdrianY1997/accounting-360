/**
 * Money helpers. All monetary math runs in integer cents to avoid float drift;
 * values are stored as fixed-2 strings (Drizzle `numeric`).
 */
export const toCents = (n: number) => Math.round(n * 100);
export const centsToString = (cents: number) => (cents / 100).toFixed(2);
