// src/data/products/framedPoster.ts

export type Currency = 'GBP' | 'USD' | 'EUR';

export type FrameColor = 'Black' | 'White' | 'Wood' | 'Dark wood';
export type Orientation = 'Vertical' | 'Horizontal';

export type SizeLabel =
  | '15×20 cm / 6×8″'
  | '30×40 cm'
  | '40×50 cm'
  | '50×70 cm'
  | '70×100 cm / 28×40″'; // add/remove as you like

export type PriceMap = Partial<Record<Currency, number>>; // values in major units (e.g. GBP)

export type VariantMatrix = {
  // frame -> orientation -> puid
  [F in FrameColor]?: Partial<Record<Orientation, string>>;
};

export type SizeOption = {
  size: SizeLabel;
  price: PriceMap;          // your sell price, per currency
  variants: VariantMatrix;  // which combinations exist and their product UIDs
};

export type FramedPosterProduct = {
  slug: 'framed-poster-premium-semi-gloss';
  title: string;
  description: string;
  frame_options: FrameColor[];
  orientations: Orientation[];
  sizes: SizeOption[];
};
