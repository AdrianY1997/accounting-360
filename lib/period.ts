/** Date-range helpers for reports / commissions. */

export type Range = { from: Date; to: Date };

/** Single day [start, end]. */
export function dayRange(now = new Date()): Range {
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { from, to };
}

/** Current calendar month [start, end]. */
export function monthRange(now = new Date()): Range {
  const from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { from, to };
}

/**
 * Parses `from`/`to` YYYY-MM-DD strings into an inclusive range. Returns null
 * if either is missing/invalid (caller falls back to a default).
 */
export function parseRange(
  fromStr: string | null,
  toStr: string | null,
): Range | null {
  if (!fromStr || !toStr) return null;
  const from = new Date(`${fromStr}T00:00:00`);
  const to = new Date(`${toStr}T23:59:59.999`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return null;
  return { from, to };
}

/** YYYY-MM-DD for date inputs. */
export function toDateInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}
