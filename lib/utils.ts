import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;

/** True when `date` is within the last two weeks — drives "Nuevo" badges. */
export function isNew(date: Date | string | null | undefined): boolean {
  if (!date) return false;
  const t = typeof date === "string" ? new Date(date).getTime() : date.getTime();
  return Date.now() - t < TWO_WEEKS_MS;
}
