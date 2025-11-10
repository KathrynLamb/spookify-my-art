export type ShipMethod = 'Standard' | 'Tracked' | 'Express';

const BASE = {
  UK:     { Standard: 3, Tracked: 2, Express: 1 },
  US:     { Standard: 5, Tracked: 3, Express: 2 },
  EU:     { Standard: 4, Tracked: 3, Express: 2 },
  Canada: { Standard: 6, Tracked: 4, Express: 3 },
} as const;

export function estimateEta(country: keyof typeof BASE, method: ShipMethod, cutoffHourLocal = 14): Date {
  const days = BASE[country]?.[method] ?? 5;
  const now = new Date();
  // simple cutoff: if after cutoff, add one handling day
  const afterCutoff = now.getHours() >= cutoffHourLocal;
  const extra = afterCutoff ? 1 : 0;

  const eta = new Date(now);
  eta.setDate(now.getDate() + days + extra);
  return eta;
}
