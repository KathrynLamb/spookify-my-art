import { shippingForCountry } from '@/data/shipping/tiers';
import type { Currency } from './currency';

export function estimateShipping(iso2: string, currency: Currency) {
  const cfg = shippingForCountry(iso2);
  const tiers = cfg.tiers.map(t => ({
    label: t.label,
    estDays: t.estDays,
    price: t.price[currency] ?? t.price.GBP ?? 0,
  }));
  return { country: cfg.country, tiers };
}
