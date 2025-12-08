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
    greetings: [
      "Hello! Ready to design a mug that spreads a little Christmas cheer? 🎄☕",
      "Welcome back! Let’s create a cosy, festive mug together. Your ideas + holiday magic = perfection! ✨",
      "Hey there! Ready to make a mug that feels like a warm December hug? Let’s do this! 🤗☕",
      "Let’s craft something merry and bright! Your perfect Christmas mug starts here. 🎁",
      "It’s mug-making time! I’m here to help you design something festive, fun, and uniquely YOU. ✨",
      "Looking for Christmas inspiration? Don’t worry — we’ll create something magical together. 🎄",
      "Ready to sprinkle a little holiday sparkle onto your mug design? Let’s get creative! ✨☕",
      "Hello! Let’s turn your festive idea into a mug someone will treasure all season long. ❤️",
      "Grab a cup of cocoa and let’s design a mug as warm and wonderful as December feels. ☕❄️",
      "Whether you want cute, funny, sentimental or totally unique — your perfect Christmas mug starts here! 🎄💫"
    ],
    

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

    prices: { GBP: 19.99, USD: 36.99, EUR: 33.99 },
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
    greetings: [
      "Welcome! Ready to create a Christmas cushion that lights up the whole room? 🎄✨",
      "Let’s make something festive and unforgettable — your perfect December sofa art starts here! 🖼️",
      "Hey there! I’m excited to help you design a cushion full of warmth, joy, and holiday magic. ✨",
      "Your cushion design journey starts now — festive, fun, and totally YOU. Let’s go! 🎄🖼️",
      "Let’s turn your imagination into a beautiful Christmas keepsake. Ready when you are! ❄️✨",
      "Want cosy winter vibes? Something bold and bright? I’m here to help bring your December vision to life! 🎨",
      "Let’s create wall art that feels like a warm festive memory. You bring the idea — I’ll help with the magic. 🎄",
      "Ready to design a canvas that becomes someone’s favourite Christmas decoration? Let’s do it! ❤️",
      "Whether you’re going classic, cute, modern or whimsical — I’m here to help your Christmas canvas shine. ✨"
    ],

    jollySrc: "/jollyfy/prod-cushion.png",
    src: "/mockups/cushion_blank.jpg", // add your placeholder image
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
      template: "/mockups/cushion_blank.jpg",
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
    /* -------------------------------------------------------------
   * GREETING CARDS — 6×6" Gloss — Mail4Me Direct
   * We expose two app variants (Single + Pack of 10)
   * but both route to the same Prodigi SKU with different quantity.
   * ------------------------------------------------------------- */

    {
      title: "Greeting card (6×6\") — Single",
      name: "Square Gloss Greeting Card",
      type: "Christmas",
      category: "cards",
      printProvider: "prodigi",
    
      // gallery art
      jollySrc: "/jollyfy/cards.png",
      // your own blank placeholder (create this asset)
      src: "/prodigi/cards/gloss-6x6-blank.png",
      href: "/jollyfy/products?cat=cards",
    
      /* -------------------------------------------------------------
       * APP IDENTIFIER (unique for your UI)
       * ------------------------------------------------------------- */
      productUID: "gre_card_6x6_gloss_mail4me_single",
    
      /* -------------------------------------------------------------
       * PRODIGI IDENTIFIERS
       * ------------------------------------------------------------- */
      prodigiSku: "GLOBAL-GRE-GLOS-6X6-DIR",
    
      /* -------------------------------------------------------------
       * PRINT GENERATION CONFIG
       * 4-panel flat sheet, LEFT → RIGHT:
       * 1) Outer Back, 2) Outer Front, 3) Inside Left, 4) Inside Right
       *
       * IMPORTANT:
       * Prodigi UI for this SKU shows recommended size 6732×1713px @ 300dpi.
       * Use 1713 to match the provider's validator.
       * ------------------------------------------------------------- */
      printSpec: {
        provider: "prodigi",
        surfaceName: "Fine art greetings card 6x6 gloss (Mail4Me Direct)",
    
        finalWidthPx: 6732,
        finalHeightPx: 1713,
        dpi: 300,
        targetAspect: 6732 / 1713,
    
        // Optional physical hints (harmless + useful elsewhere)
        widthMm: 140,
        heightMm: 140,
    
        // Optional safety hint for text/faces
        safeZonePx: {
          top: 80,
          bottom: 80,
          left: 80,
          right: 80,
        },
    
        previewWidthPx: 2048,
    
        llmPrintRules: [
          "Produce artwork exactly at 6732×1712 pixels.",
          "This is a 4-panel horizontal greetings card print sheet.",
          "Treat the artwork as FOUR equal panels across the width.",
          "Panel order LEFT → RIGHT:",
          "Panel 1: Outer Back",
          "Panel 2: Outer Front (main cover artwork)",
          "Panel 3: Inside Left",
          "Panel 4: Inside Right (user message goes here if provided)",
        
          "IMPORTANT PANEL GEOMETRY:",
          "Each panel's WIDTH is exactly 1/4 of the total width (about 1683px).",
          "Although the full file height is 1712px, the intended finished card faces are SQUARE.",
          "Therefore, compose each panel's MAIN DESIGN inside a centered square live area roughly 1683×1683px.",
          "Center this square vertically within each panel.",
          "Extend background colors/patterns to fill the full panel height to the edges.",
        
          "Do NOT create one continuous scene spanning multiple panels.",
          "Do NOT let characters, objects, or text cross panel boundaries.",
          "Only Panel 2 should contain the full illustrated scene unless the user requests otherwise.",
          "Keep Panels 1, 3, and 4 minimal or subtle unless otherwise instructed.",
          "Never place text across panel boundaries.",
        
          "Do NOT include templates, fold guides, labels, dashed lines, or watermarks.",
          "No borders or transparency.",
          "Fill each panel edge-to-edge with artwork or subtle clean color.",
          "Keep important faces/text comfortably away from panel edges."
        ],
      },        
    
      /* -------------------------------------------------------------
       * MOCKUP
       * Use preview image as input; show a FOLDED card product shot.
       * ------------------------------------------------------------- */
      mockup: {
        template: "/mockups/blank_card.png",
        prompt: `
    Create a clean, photorealistic studio mockup of a premium square folded greeting card.
    
    COMPOSITION:
    - The card must be FOLDED and STANDING upright.
    - 3/4 angle view.
    - Include a matching kraft envelope beside the card.
    - Neutral seamless studio background (no table, no room scene, no extra props).
    - Soft even lighting.
    
    ARTWORK RULES:
    - Apply the provided image ONLY to the OUTER FRONT face of the folded card.
    - Do not add any new text, graphics, logos, patterns, or watermarks.
    - Do not alter the artwork content.
    - Do not show the flat print sheet.
    - Do not show inside panels unless explicitly instructed.
    
    RESULT:
    - The card should clearly look like a real folded card product photo.
        `.trim(),
      },
    
      greetings: [
        "Hello! Let’s make a 6×6” card that feels thoughtful, fun, and totally personal. ✨",
        "Ready to create the perfect last-minute card? I’ll help you make it look premium and heartfelt. 💌",
        "Let’s design a card that looks like it came from a boutique — but it’s all you. 🎄",
        "Want cute, funny, or elegant? We can nail the vibe in a few minutes. ✨",
      ],
    
      creativeGuidance: [
        "Ask who the card is for (friend, coworker, partner, family).",
        "Offer 3 quick style paths: cute, funny, elegant.",
        "Only ask about inside text near finalization (avoid early interruptions).",
      ],
    
      generationNotes: [
        "This product uses a 4-panel layout: Outer Back, Outer Front, Inside Left, Inside Right.",
        "The main artwork belongs on the Outer Front panel unless the user wants a full multi-panel concept.",
        "Other panels should be subtle or blank unless the user specifies otherwise.",
        "Inside Right is the default location for a printed message if provided.",
      ],
    
      requirePhotos: {
        min: 0,
        labels: [],
      },
    
      description:
        "A premium 6×6\" gloss greetings card printed inside and out. Ideal for Secret Santa and last-minute thoughtful gifting.",
    
      specs: [
        "Square 6×6\" greetings card",
        "280gsm gloss paper",
        "Printed inside and out",
        "Kraft envelope included",
        "Mail4Me Direct Delivery (single card)",
      ],
    
      prices: {
        GBP: 3.99,
        USD: 5.99,
        EUR: 5.49,
      },
    
      shippingTime: {
        uk: "Made in 1–3 business days",
      },
    
      shippingRegions: ["UK"],
    
      returnPolicy:
        "Printed-on-demand items are not returnable unless faulty or damaged.",
    
      care: [],
    
      inStock: true,
    },
    
    
    {
      title: "Greeting card (6×6\") — Pack of 10",
      name: "Square Gloss Greeting Card (10-pack)",
      type: "Christmas",
      category: "cards",
      printProvider: "prodigi",
    
      jollySrc: "/jollyfy/cards.png",
      src: "/prodigi/cards/gloss-6x6-blank.png",
      href: "/jollyfy/products?cat=cards",
    
      /* -------------------------------------------------------------
       * APP IDENTIFIER (unique)
       * ------------------------------------------------------------- */
      productUID: "gre_card_6x6_gloss_mail4me_pack10",
    
      /* -------------------------------------------------------------
       * PRODIGI IDENTIFIERS
       * Same SKU; your order flow should set quantity=10
       * ------------------------------------------------------------- */
      prodigiSku: "GLOBAL-GRE-GLOS-6X6-DIR",
    
      // Optional metadata for your UI / ordering logic
      packSize: 10,
    
      /* Same print spec as single */
      printSpec: {
        provider: "prodigi",
        surfaceName: "Fine art greetings card 6x6 gloss (Mail4Me Direct)",
    
        finalWidthPx: 6732,
        finalHeightPx: 1712,
        targetAspect: 6732 / 1712,
        dpi: 300,
        previewWidthPx: 2048,
    
        llmPrintRules: [
          "Produce artwork exactly at 6732×1712 pixels.",
          "This is a 4-panel horizontal greetings card print sheet.",
          "Treat the artwork as FOUR equal panels across the width.",
          "Panel order LEFT → RIGHT:",
          "Panel 1: Outer Back",
          "Panel 2: Outer Front (main cover artwork)",
          "Panel 3: Inside Left",
          "Panel 4: Inside Right (user message goes here if provided)",
    
          "Do NOT create one continuous scene spanning multiple panels.",
          "Do NOT let characters, objects, or text cross panel boundaries.",
          "Only Panel 2 should contain the full illustrated scene unless the user requests otherwise.",
          "Keep Panels 1, 3, and 4 minimal or subtle unless otherwise instructed.",
          "Never place text across panel boundaries.",
    
          "Do NOT include templates, fold guides, labels, dashed lines, or watermarks.",
          "No borders or transparency.",
          "Fill each panel edge-to-edge with artwork or subtle clean color.",
          "Keep important faces/text comfortably away from panel edges."
        ],
      },
    
      mockup: {
        template: "/mockups/blank_cards_10.png",
        prompt: `
    Create a photorealistic mockup of a neat stack of ten premium square gloss greeting cards.
    Show the provided artwork on the top card's front cover only.
    Include a kraft envelope beside the stack.
    Clean studio or soft festive setting with warm lighting.
    Do not add extra text, logos, or new artwork.
    Use only the provided image for the card print area.
        `.trim(),
      },
    
      greetings: [
        "Let’s create a beautiful 10-pack of 6×6” cards — perfect for gifting or sending out this season. 💌✨",
        "Want your own mini set of boutique-style cards? Let’s make a 10-pack that looks premium and personal. 🎄",
      ],
    
      creativeGuidance: [
        "Ask who the cards are for and what tone they want.",
        "Offer 3 quick style paths: cute, funny, elegant.",
        "Ask if they want inside text printed for all cards.",
        "Keep it fast and friendly.",
      ],
    
      generationNotes: [
        "This product uses a 4-panel layout: Outer Back, Outer Front, Inside Left, Inside Right.",
        "The main artwork belongs on the Outer Front panel unless the user wants a full multi-panel concept.",
        "Other panels should be subtle or blank unless the user specifies otherwise.",
        "Ask the user if they want a printed inside message for the Inside Right panel.",
      ],
    
      requirePhotos: {
        min: 0,
        labels: [],
      },
    
      description:
        "A premium 10-pack of 6×6\" gloss greetings cards printed inside and out. Great for holiday cards, thank-yous, and last-minute gifting.",
    
      specs: [
        "Pack of 10 square 6×6\" greetings cards",
        "280gsm gloss paper",
        "Printed inside and out",
        "Kraft envelopes included",
        "Mail4Me Direct Delivery (10 cards)",
      ],
    
      prices: {
        GBP: 24.99,
        USD: 34.99,
        EUR: 32.99,
      },
    
      shippingTime: {
        uk: "Made in 1–3 business days",
      },
    
      shippingRegions: ["UK"],
    
      returnPolicy:
        "Printed-on-demand items are not returnable unless faulty or damaged.",
    
      care: [],
    
      inStock: true,
    },
    
  
  ]