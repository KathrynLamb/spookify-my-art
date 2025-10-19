// src/data/products/index.ts
import { FRAMED_POSTER } from './framed-poster'
import { POSTER } from './poster'

export type ProductSlug = 'framed-poster' | 'poster'
export type Orientation = 'Vertical' | 'Horizontal'

export { FRAMED_POSTER, POSTER }

/**
 * Input for finding an orderable Gelato variant.
 */
export type VariantLookupInput =
  | {
      product: 'poster'
      size: string
      orientation: Orientation
      // posters don't use frameColor
    }
  | {
      product: 'framed-poster'
      size: string
      orientation: Orientation
      frameColor: (typeof FRAMED_POSTER.variants)[number]['frameColor']
    }

/**
 * Returns the correct Gelato productUid for the given selection.
 * If not found, returns null.
 */
export function findProductUid(input: VariantLookupInput): string | null {
  if (input.product === 'poster') {
    const v = POSTER.variants.find(
      x => x.sizeLabel === input.size && x.orientation === input.orientation
    )
    return v?.productUid ?? null
  }

  // framed-poster
  const vf = FRAMED_POSTER.variants.find(
    x =>
      x.sizeLabel === input.size &&
      x.orientation === input.orientation &&
      x.frameColor === input.frameColor
  )
  return vf?.productUid ?? null
}
