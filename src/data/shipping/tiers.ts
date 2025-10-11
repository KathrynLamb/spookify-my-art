import type { Currency } from '@/lib/currency';

export type ShippingTier = {
  label: 'Standard' | 'Express';
  estDays: [number, number];          // min–max business days
  price: Partial<Record<Currency, number>>; // major units
};

export type CountryShipping = {
  country: string; // ISO-2
  tiers: ShippingTier[];
};

export const SHIPPING_BY_COUNTRY: Record<string, CountryShipping> = {
  GB: {
    country: 'GB',
    tiers: [
      { label: 'Standard', estDays: [3, 5], price: { GBP: 4.49, USD: 7.00, EUR: 6.00 } },
      { label: 'Express',  estDays: [1, 2], price: { GBP: 9.99, USD: 14.00, EUR: 12.00 } },
    ],
  },
  US: {
    country: 'US',
    tiers: [
      { label: 'Standard', estDays: [4, 7], price: { USD: 6.99, GBP: 5.49, EUR: 6.49 } },
      { label: 'Express',  estDays: [2, 3], price: { USD: 14.99, GBP: 12.49, EUR: 13.99 } },
    ],
  },
  EU: {
    country: 'EU',
    tiers: [
      { label: 'Standard', estDays: [3, 6], price: { EUR: 5.99, GBP: 4.99, USD: 6.99 } },
      { label: 'Express',  estDays: [1, 3], price: { EUR: 12.99, GBP: 10.99, USD: 13.99 } },
    ],
  },
};

export function shippingForCountry(iso2: string): CountryShipping {
  return SHIPPING_BY_COUNTRY[iso2] ?? SHIPPING_BY_COUNTRY.GB;
}
