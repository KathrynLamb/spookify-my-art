// src/lib/products/findVariants.ts
import { FRAMED_POSTER, POSTER } from '@/lib/products';

type Canonical = 'Portrait' | 'Landscape' | 'Square';
type LegacyRect = 'Vertical' | 'Horizontal';
type PosterOrientation = (typeof POSTER.variants)[number]['orientation']; // likely 'Vertical' | 'Horizontal'

/** Accept either naming and normalize to our canonical set. */
function toCanonical(o: Canonical | LegacyRect): Canonical {
  const s = String(o).toLowerCase();
  if (s === 'portrait' || s === 'vertical') return 'Portrait';
  if (s === 'landscape' || s === 'horizontal') return 'Landscape';
  if (s === 'square') return 'Square';
  return 'Portrait';
}

/** Input for finding an orderable Gelato variant. */
export type FindInput =
  | {
      product: 'poster';
      sizeLabel: string;
      orientation: Canonical | LegacyRect; // posters don't use frameColor
    }
  | {
      product: 'framed-poster';
      sizeLabel: string;
      orientation: Canonical | LegacyRect; // supports Square too
      frameColor: (typeof FRAMED_POSTER.variants)[number]['frameColor'];
    };

/** Returns the correct Gelato productUid for the given selection (or null). */
export function findProductUid(input: FindInput): string | null {
  const orientation = toCanonical(input.orientation);

  if (input.product === 'poster') {
    // Normalize poster variant orientations too (they may be Vertical/Horizontal)
    const v = POSTER.variants.find(
      (x) => x.sizeLabel === input.sizeLabel && toCanonical(x.orientation as PosterOrientation) === orientation
    );
    return v?.productUid ?? null;
  }

  // framed-poster (already canonical: Portrait/Landscape/Square)
  const vf = FRAMED_POSTER.variants.find(
    (x) =>
      x.sizeLabel === input.sizeLabel &&
      x.frameColor === input.frameColor &&
      x.orientation === orientation
  );
  return vf?.productUid ?? null;
}
