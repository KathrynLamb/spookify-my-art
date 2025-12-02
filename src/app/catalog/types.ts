// catalog/types.ts
export type Orientation = 'Horizontal' | 'Vertical' | 'Square';

export type Provider = 'gelato' | 'prodigi' | 'inhouse';

export type Size = {
  id: string;                // "5x7", "11x14", "15oz"
  widthIn: number;           // finished size (inches)
  heightIn: number;
  orientation: Orientation;
  dpiRecommended: number;    // e.g., 300
  bleedIn?: number;          // per side (cards/prints)
  safeMarginIn?: number;     // text safe area per edge
  printableAreaIn?: {        // for mugs/cushions etc (wrap areas)
    widthIn: number;
    heightIn: number;
    offsetLeftIn?: number;   // from left edge (for mugs, handle clearance)
    offsetTopIn?: number;
  };
};

export type Spec = {
  spec: string
}

export type Variant = {
  id: string;                 // "mug_white_11oz", "card_folded_5x7_matte"
  sizeId: string;             // link to Size
  material?: string;          // "ceramic", "museum matte"
  color?: string;             // "white", "black frame"
  frameColor?: string;
  finish?: string;            // "matte", "glossy"
  providerSku?: Partial<Record<Provider, string>>; // map to real SKUs
};

export type Product = {
  id: string;                 // "mug", "holiday_card", "cushion", "framed_print"
  title: string;              // "Mugs"
  category: 'mugs' | 'cards' | 'soft' | 'wall' | 'drinkware';
  thumbnail: string;          // UI image
  route: string;              // products page route
  orientations: Orientation[]; // allowed
  sizes: Size[];
  variants: Variant[];
  // What the AI needs to know (tiny + human-readable)
  aiHints: {
    promptDo?: string[];      // “avoid text near 0.25in margins”, etc
    promptDont?: string[];
    colorProfile?: 'sRGB';
    backgroundAdvice?: string; // “leave rim unprinted”, “allow wrap”
    textAdvice?: string;       // “place names bottom center”, etc
  };
};
