// src/lib/products.ts

export const PRODUCTS = [
  {
    title: "Mugs",
    printProvider: "prodigi",
    jollySrc: "/jollyfy/mug.png",
    src: "/prodigi/Prodigi11ozMugblank.png",
    href: "/jollyfy/products?cat=mugs",
    name: "Mug",
    type: "Christmas",

    // this must match the ?product=… in your URL
    productUID: "mug_product_msz_11-oz_mmat_ceramic-white_cl_4-0",
    prodigiSku: "H-MUG-W",

    printSpec: {
      provider: "prodigi",
      surfaceName: "11oz photo mug wrap",

      // Prodigi template exact print size
      finalWidthPx: 2670,
      finalHeightPx: 1110,
      dpi: 300,

      targetAspect: 2670 / 1110, // ≈ 2.405

      widthMm: 229,
      heightMm: 95,

      safeZonePx: {
        top: 140,
        bottom: 140,
        left: 120,
        right: 120,
      },

      previewWidthPx: 2048,

      llmPrintRules: [
        "Produce artwork exactly at 2670×1110 pixels.",
        "Fill the full canvas — no transparency or borders.",
        "Do NOT include templates, dashed lines, or guides.",
        "Keep important elements inside a safe zone ~140px from top and bottom.",
        "Keep important elements ~120px away from left and right edges near the handles.",
        "Output a seamless wrap-around continuous image.",
        "Avoid placing text extremely close to the left and right edges.",
      ],
    },

    mockup: {
      template: "/mockups/mug_blank.png",
      mugWidthPx: 2400,
      mugHeightPx: 1800,
      placement: {
        x: 180,
        y: 520,
        width: 2040,
        height: 730,
      },
      prompt: `
      Create a photorealistic product mockup of an 11oz white ceramic mug.
      Wrap the provided artwork around the mug as a single continuous band.
      Cozy living-room Christmas background, soft warm lighting, high detail.
      No additional artwork; use the provided image only.
          `,
    },

    creativeGuidance: [
      "Ask lightly about preferred art style.",
      "Ask if optional text should appear on the mug.",
      "Avoid overwhelming the user with questions.",
      "If unsure, offer 3 style shortcuts (cute, funny, painterly).",
    ],

    generationNotes: [
      "11oz mug prints are wide 2.4:1 landscapes.",
      "Text should stay away from handle edges.",
      "Use vibrant colors unless the user says otherwise.",
    ],

    requirePhotos: {
      min: 0,
      labels: [],
    },

    description:
      "Your new favourite mug—made even better with your own AI-powered artwork. Cute, quirky, or chaotic… you choose.",

    specs: [
      "Ceramic 11oz mug",
      "Dishwasher and microwave safe",
      "Product safety tested",
    ],

    imageUrls: [
      "https://cdn.sanity.io/images/...1",
      "https://cdn.sanity.io/images/...2",
      "https://cdn.sanity.io/images/...3",
    ],

    prices: { GBP: 11.99, USD: 36.99, EUR: 33.99 },
    shippingTime: {
      uk: "2–4 business days",
      eu: "3–6 business days",
      us: "4–7 business days",
      international: "7–12 business days",
    },
    
    shippingRegions: ["UK", "EU", "USA", "Canada", "Australia"],
    
    returnPolicy:
      "14-day replacements for damaged/defective items. Printed-on-demand items are not returnable unless faulty.",
    
    care: ["Dishwasher safe", "Microwave safe"],
    
    inStock: true, // always true for POD
  },
 
  

  {
    title: "Cushion (24×24\")",
    name: "Faux Linen Cushion",
    type: "Home Decor",
    category: "cushions",
    printProvider: "prodigi",

    jollySrc: "/jollyfy/prod-cushion.png",
    src: "/jollyfy/prod-cushion.png", // add your placeholder image
    href: "/jollyfy/products?cat=cushions",

    /* -------------------------------------------------------------
     * PRODIGI IDENTIFIERS
     * ------------------------------------------------------------- */
    productUID: "GLOBAL-CUSH-24X24-LIN",
    prodigiSku: "GLOBAL-CUSH-24X24-LIN",

    /* -------------------------------------------------------------
     * PRINT GENERATION CONFIG (for Gemini)
     * ------------------------------------------------------------- */
    printSpec: {
      provider: "prodigi",

      // Prodigi recommended size
      finalWidthPx: 3675,
      finalHeightPx: 3675,
      dpi: 300,
      targetAspect: 1, // square

      widthMm: 610,
      heightMm: 610,

      safeZonePx: {
        top: 200,
        bottom: 200,
        left: 200,
        right: 200,
      },

      llmPrintRules: [
        "Produce artwork exactly at 3675×3675 pixels.",
        "Full bleed square image — no borders, no transparency.",
        "Do NOT include pillows, mockups or staging — just the artwork.",
        "Keep important details away from the outer 200px safe zone.",
        "The image will be printed single-sided (white linen back).",
        "Avoid text right at the edges to prevent stitching cutoff.",
      ],

      previewWidthPx: 2048,
    },

    /* -------------------------------------------------------------
     * MOCKUP CONFIG (optional — if you want mockups)
     * ------------------------------------------------------------- */
    mockup: {
      template: "/mockups/prod_cushion.png",
      cushionWidthPx: 2000,
      cushionHeightPx: 2000,

      placement: {
        x: 160,
        y: 160,
        width: 1680,
        height: 1680,
      },
      prompt: `
      Create a photorealistic mockup of a 24×24 inch faux-linen cushion.
      Center the provided square artwork on the front face of the cushion.
      Use a soft, cozy living-room background with warm lighting.
      Do not add frames, logos, borders, or extra decorations.
      Use only the provided artwork for the print area.
          `,
    },

    /* -------------------------------------------------------------
     * CHAT LLM GUIDANCE
     * ------------------------------------------------------------- */
    creativeGuidance: [
      "Ask lightly about preferred aesthetic (e.g. cozy, minimal, watercolor, boho).",
      "Ask if they want text printed on the cushion.",
      "Offer style shortcuts such as: 'cute', 'artistic', 'photographic', 'abstract'.",
      "Ensure the assistant understands this is a square 1:1 artwork.",
    ],

    generationNotes: [
      "Square 1:1 artwork.",
      "Single-sided cushion (white linen back).",
      "Full bleed — no borders.",
      "Keep key subject away from the stitching edges.",
    ],

    /* -------------------------------------------------------------
     * PHOTO REQUIREMENTS
     * ------------------------------------------------------------- */
    requirePhotos: {
      min: 0,
      labels: [],
    },

    /* -------------------------------------------------------------
     * SHOP DATA
     * ------------------------------------------------------------- */
    description:
      "A luxurious 24×24” faux-linen cushion featuring your AI-designed artwork. Vibrant dye-sublimation print and premium feel.",

    specs: [
      "24×24 inch faux linen cushion",
      "Single-sided print with white back",
      "Fibre or polyester filling",
      "Zippered cover, high-vibrancy dye-sublimation print",
    ],

    prices: {
      GBP: 34.99,
      USD: 49.99,
      EUR: 46.99,
    },

    imageUrls: [
      // add your own or leave blank
    ],
    shippingTime: {
      uk: "2–4 business days",
      eu: "3–6 business days",
      us: "4–7 business days",
      international: "7–12 business days",
    },
    
    shippingRegions: ["UK", "EU", "USA", "Canada", "Australia"],
    
    returnPolicy:
      "14-day replacements for damaged/defective items. Printed-on-demand items are not returnable unless faulty.",
    
    care: ["Dishwasher safe", "Microwave safe"],
    
    inStock: true, // always true for POD
  },

  {
    title: "Framed prints",
    jollySrc: "/jollyfy/framed.png",
    src: "/jollyfy/framed.png",
    href: "/jollyfy/products?cat=prints",
    name: "Art",
    type: "Christmas",
    comingSoon: true
  },
  {
    title: "Holiday cards",
    jollySrc: "/jollyfy/cards.png",
    src: "/jollyfy/cards.png",
    href: "/jollyfy/products?cat=posters",
    name: "Holiday Card",
    type: "Christmas",
    comingSoon: true
  },
];
