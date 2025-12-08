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
       * PRODIGI IDENTIFIERS (confirmed by you)
       * ------------------------------------------------------------- */
      prodigiSku: "GLOBAL-GRE-GLOS-6X6-DIR",
  
      /* -------------------------------------------------------------
       * PRINT GENERATION CONFIG
       * IMPORTANT: 4-panel layout - NOT a single panorama.
       * ------------------------------------------------------------- */
      printSpec: {
        provider: "prodigi",
        surfaceName: "Fine art greetings card 6x6 gloss (Mail4Me Direct)",
  
        // From your Prodigi image requirements
        finalWidthPx: 6732,
        finalHeightPx: 1712,
        dpi: 300,
        targetAspect: 6732 / 1712,
  
        widthMm: 140,
        heightMm: 140,
  
        // This is a multi-panel flat sheet for outside + inside.
        // We do not hard-assert panel order here — the model should
        // follow the template's panel labels.
        safeZonePx: {
          top: 80,
          bottom: 80,
          left: 80,
          right: 80,
        },
  
        previewWidthPx: 2048,
  
        llmPrintRules: [
          "Produce artwork exactly at 6732×1712 pixels.",
          "This file is a multi-panel greetings card print sheet.",
          "Treat it as 4 equal panels across the width.",
          "Do NOT create one continuous scene spanning multiple panels.",
          "Follow the panel order and labels from the template.",
          "Place the main front design only in the front-cover panel.",
          "Keep the back panel minimal (small mark/signature optional).",
          "Keep inside panels readable for any inside message.",
          "Never place text across panel boundaries.",
          "Avoid placing important text/faces within ~80px of any panel edge.",
          "Do NOT include templates, fold guides, labels, dashed lines, or watermarks.",
          "Full-bleed artwork only; no transparency or borders.",
        ],
      },
  
      /* -------------------------------------------------------------
       * MOCKUP (optional)
       * You can add a real blank mockup later.
       * ------------------------------------------------------------- */
      mockup: {
        template: "/mockups/blank_card.png",
        prompt: `
  Create a photorealistic mockup of a premium square gloss greeting card.
  Show the provided artwork on the front.
  Include a kraft envelope nearby.
  Soft festive setting, warm lighting.
  Do not add extra text, logos, or new artwork.
  Use only the provided image for the card print area.
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
        "Ask if they want inside text printed (direct delivery).",
        "Keep this fast and light for last-minute gifting.",
      ],
  
      generationNotes: [
        "This product uses a 4-panel layout: Outer Back, Outer Front, Inside Left, Inside Right.",
        "The main artwork belongs only on the Outer Front panel.",
        "Other panels should be subtle or blank unless the user specifies otherwise.",
        "Ask the user if they want a printed inside message on the Inside Right panel.",
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
       * PRODIGI IDENTIFIERS (same SKU; order quantity=10)
       * ------------------------------------------------------------- */
      prodigiSku: "GLOBAL-GRE-GLOS-6X6-DIR",
  
      /* Same print spec as single */
      printSpec: {
        provider: "prodigi",
        surfaceName: "Fine art greetings card 6x6 gloss (Mail4Me Direct)",
  
        finalWidthPx: 6732,
        finalHeightPx: 1712,
        dpi: 300,
        targetAspect: 6732 / 1712,
  
        widthMm: 140,
        heightMm: 140,
  
        safeZonePx: {
          top: 80,
          bottom: 80,
          left: 80,
          right: 80,
        },
  
        previewWidthPx: 2048,
  
        llmPrintRules: [
          "Produce artwork exactly at 6732×1712 pixels.",
          "This is a 4-panel horizontal card layout, LEFT → RIGHT:",
          "Panel 1: Outer Back",
          "Panel 2: Outer Front (main cover artwork)",
          "Panel 3: Inside Left",
          "Panel 4: Inside Right (user message goes here if provided)",
          "Do NOT create one continuous scene across panels.",
          "Do NOT let characters/objects cross between panels.",
          "Only Panel 2 should contain the full illustrated scene unless the user requests otherwise.",
          "Keep Panels 1, 3, and 4 minimal unless otherwise instructed.",
          "No fold marks, templates, borders, or design guides.",
          "Fill all panels edge-to-edge with color or artwork.",
          "Keep important details ~80px inside each edge.",
        ],
        
      },
  
      mockup: {
        template: "/mockups/blank_cards_10.png",
        prompt: `
  Create a photorealistic mockup of a premium square gloss greeting card.
  Show the provided artwork on the front.
  Include a small, neat stack of cards to imply multi-quantity.
  Soft festive setting, warm lighting.
  Do not add extra text, logos, or new artwork.
  Use only the provided image for the card print area.
        `.trim(),
      },
  
      greetings: [
        "Want a 10-pack for coworkers or friends? Let’s make a design that looks amazing in a set. 🎁",
        "We can make a classy or funny batch in minutes — perfect for Secret Santa season. 💌",
      ],
  
      creativeGuidance: [
        "Ask if they want a universal message or a name-free front design.",
        "Offer style shortcuts: cute set, minimal set, funny set.",
      ],
  
      generationNotes: [
        "Same print file as the single card.",
        "Your order integration should send quantity=10.",
      ],
  
      requirePhotos: {
        min: 0,
        labels: [],
      },
  
      description:
        "A 10-pack of premium 6×6\" gloss greetings cards printed inside and out. Great for teams, classrooms, and last-minute holiday wins.",
  
      specs: [
        "Square 6×6\" greetings cards",
        "280gsm gloss paper",
        "Printed inside and out",
        "Kraft envelopes included",
        "Pack of 10 (quantity controlled in your checkout)",
      ],
  
      prices: {
        GBP: 19.99,
        USD: 29.99,
        EUR: 26.99,
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