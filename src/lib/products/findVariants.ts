// import { FRAMED_POSTER } from '@/data/products/framed-poster';
// import { POSTER } from '@/data/products/poster';
import { FRAMED_POSTER } from './framed-poster';
import { POSTER } from './poster';

type FindInput = {
  product: 'framed-poster' | 'poster';
  sizeLabel: string;
  orientation: 'Vertical' | 'Horizontal';
  frameColor?: string; // only for framed
};

export function findProductUid({
  product,
  sizeLabel,
  orientation,
  frameColor,
}: FindInput): string | null {
  if (product === 'poster') {
    const v = POSTER.variants.find(
      x => x.sizeLabel === sizeLabel && x.orientation === orientation
    );
    return v?.productUid || null;
  }
  // framed
  const v = FRAMED_POSTER.variants.find(
    x => x.sizeLabel === sizeLabel &&
         x.orientation === orientation &&
         x.frameColor === frameColor
  );
  return v?.productUid || null;
}
