import type {
  FrameColor,
  FramedPosterProduct,
  Orientation,
} from '@/data/products/framed-poster';
import type { PosterProduct, PosterVariant } from '@/data/products/poster';
import type { Currency } from './currency';

// --- Framed posters ---

export function availableFrameColors(
  product: FramedPosterProduct,
  sizeLabel: string,
  orientation: Orientation,
): FrameColor[] {
  const size = product.sizes.find(s => s.size === sizeLabel);
  if (!size) return [];

  const set = new Set<FrameColor>();
  for (const [frameColor, orientations] of Object.entries(size.variants)) {
    if (orientations?.[orientation]) {
      set.add(frameColor as FrameColor);
    }
  }

  return [...(set.size ? set : new Set(product.frame_options))];
}

export function findFramedVariant(
  product: FramedPosterProduct,
  sizeLabel: string,
  orientation: Orientation,
  frameColor: FrameColor,
): string | undefined {
  const size = product.sizes.find(s => s.size === sizeLabel);
  return size?.variants?.[frameColor]?.[orientation];
}

// --- Matte posters ---

export function findPosterVariant(
  product: PosterProduct,
  sizeLabel: string,
  orientation: 'Vertical' | 'Horizontal',
): PosterVariant | undefined {
  return product.variants.find(
    v => v.sizeLabel === sizeLabel && v.orientation === orientation,
  );
}

// --- Pricing ---

export function priceForCurrency<T extends { prices: Partial<Record<Currency, number>> }>(
  variant: T,
  currency: Currency,
): number {
  return variant.prices[currency] ?? variant.prices.GBP ?? 0;
}
