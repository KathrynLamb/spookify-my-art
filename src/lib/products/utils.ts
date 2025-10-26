// src/lib/products/utils.ts
export type Currency = "GBP" | "USD" | "EUR";

/** Accept old/new strings and return our canonical orientation. */
export function normalizeOrientation(
  o: string | null | undefined
): "Portrait" | "Landscape" | "Square" | null {
  if (!o) return null;
  const s = String(o).toLowerCase();
  if (s === "portrait" || s === "vertical") return "Portrait";
  if (s === "landscape" || s === "horizontal") return "Landscape";
  if (s === "square") return "Square";
  return null;
}

/** Coerce array or object prices into strict { GBP, USD, EUR } numbers. */
export function coercePrices(
  input: unknown
): Record<Currency, number> & { GBP: number } {
  let map: Partial<Record<Currency, number>> = {};

  if (Array.isArray(input)) {
    for (const row of input as Array<{ currency?: string; price?: number }>) {
      const key = (row?.currency ?? "").toUpperCase() as Currency;
      if (key === "GBP" || key === "USD" || key === "EUR")
        map[key] = Number(row?.price ?? 0);
    }
  } else if (input && typeof input === "object") {
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
      const key = k.toUpperCase() as Currency;
      if (key === "GBP" || key === "USD" || key === "EUR")
        map[key] = Number(v ?? 0);
    }
  }

  const GBP = map.GBP ?? 0;
  return { GBP, USD: map.USD ?? 0, EUR: map.EUR ?? 0 };
}
