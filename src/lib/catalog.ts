// src/lib/catalog.ts
export const WOODEN_FRAMED_SEMIGLOSS = {
    slug: 'premium-wooden-framed-poster-semi-gloss',
    title: 'Premium Wooden Framed Poster',
    heroMockup: '/mockups/halloween-frame-vertical.png',
    // list only the size/orientation/frame combos you intend to sell:
    variants: [
      {
        label: '15×20 cm / 6×8″ · White frame · Vertical',
        orientation: 'ver',
        frame: 'white',
        sizeCode: '150x200-mm-6x8-inch',
        productUid:
          'framed_poster_mounted_premium_150x200-mm-6x8-inch_white_wood_w20xt20-mm_plexiglass_150x200-mm-6x8-inch_200-gsm-80lb-coated-silk_4-0_ver',
        default: true,
      },
      // Add more later as you copy PUIDs from the Gelato page…
    ],
  };
  