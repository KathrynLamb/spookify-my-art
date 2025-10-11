import type { FrameColor, FramedPosterProduct, FramedPosterVariant } from '@/data/products/framed-poster';
import type { PosterProduct, PosterVariant } from '@/data/products/poster';
import type { Currency } from './currency';

// --- Framed posters ---
export function availableFrameColors(
  product: FramedPosterProduct,
  sizeLabel: string,
  orientation: 'Vertical' | 'Horizontal',
): FrameColor[] {
  const set = new Set<FrameColor>();
  product.variants.forEach(v => {
    if (v.sizeLabel === sizeLabel && v.orientation === orientation) set.add(v.frameColor);
  });
  return [...(set.size ? set : new Set(product.frameColors))];
}

export function findFramedVariant(
  product: FramedPosterProduct,
  sizeLabel: string,
  orientation: 'Vertical' | 'Horizontal',
  frameColor: FrameColor,
): FramedPosterVariant | undefined {
  return product.variants.find(
    v => v.sizeLabel === sizeLabel && v.orientation === orientation && v.frameColor === frameColor,
  );
}

// --- Matte posters ---
export function findPosterVariant(
  product: PosterProduct,
  sizeLabel: string,
  orientation: 'Vertical' | 'Horizontal',
): PosterVariant | undefined {
  return product.variants.find(v => v.sizeLabel === sizeLabel && v.orientation === orientation);
}

// --- Pricing ---
export function priceForCurrency<T extends { prices: Partial<Record<Currency, number>> }>(
  variant: T,
  currency: Currency,
): number {
  return variant.prices[currency] ?? variant.prices.GBP ?? 0;
}
