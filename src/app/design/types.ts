// app/design/types.ts

export type Role = 'user' | 'assistant';

export type Orientation = 'Horizontal' | 'Vertical' | 'Square';

export interface SelectedProduct {
  title: string;
  printProvider?: string;
  jollySrc?: string;
  src?: string;
  href?: string;

  name?: string;
  type?: string;
  category?: string;

  productUID?: string;
  prodigiSku?: string;

  printSpec?: {
    provider?: string;
    surfaceName?: string;

    finalWidthPx: number;
    finalHeightPx: number;
    dpi: number;
    targetAspect: number;

    widthMm?: number;
    heightMm?: number;

    safeZonePx?: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };

    previewWidthPx?: number;
    llmPrintRules?: string[];
  };

  mockup?: {
    template: string;
    mugWidthPx?: number;
    mugHeightPx?: number;
    cushionWidthPx?: number;
    cushionHeightPx?: number;
    placement: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    prompt: string;
  };

  creativeGuidance?: string[];
  generationNotes?: string[];

  requirePhotos?: {
    min: number;
    labels: string[];
  };

  description?: string;
  specs?: string[];
  imageUrls?: string[];

  prices?: {
    GBP?: number;
    USD?: number;
    EUR?: number;
  };

  shippingTime?: Record<string, string>;
  shippingRegions?: string[];
  returnPolicy?: string;
  care?: string[];

  inStock?: boolean;
  comingSoon?: boolean;
}


export type ReferenceImageRole =
  | 'subject'
  | 'style'
  | 'background'
  | 'layout'
  | 'color'
  | 'other';

export type ReferenceImage = {
  id: string;
  url: string;
  role: ReferenceImageRole;
  notes?: string;
};

export type Reference = {
  id: string;         // imageId from upload
  url: string;        // for NanoBanana later
  label: string;      // human string like "Photo of your mum"
};

export type Plan = {
  intent?: string;
  vibe?: string;
  elements?: string[];
  palette?: string;
  avoid?: string[];
  textOverlay?: string;
  title?: string;

  referencesNeeded?: string[];   // from GPT
  references?: Reference[];      // added by uploads

  orientation?: 'Horizontal' | 'Vertical' | 'Square' | null;
  targetAspect?: number | null;
  finalizedPrompt?: string;
  userConfirmed?: boolean;
};

export type WaitlistProduct = {
  title: string;
  jollySrc: string;
  src: string;
  href: string;
  name: string;
  type: string;
  comingSoon: boolean;
  productUID?: string;
  prices?: Record<string, number>;
  specs?: string[];
  shippingRegions?: string[];
  shippingTime?: Record<string, string>;
};


export type ProductPlan = {
  productId: string | null;
  reasonShort?: string;
};

export type ChatMessage = {
  role: Role;
  content: string;
  images?: string[];
  typing?: boolean
};

// export type ChatResponse = {
//   content: string;
//   plan?: Plan;
//   planDelta?: Partial<Plan>;
//   productPlan?: ProductPlan | null;
//   finalizedPrompt?: string;
//   userConfirmed?: boolean
// };

export type ChatResponse = {
  ok?: boolean;
  content?: string;
  message?: string;
  plan?: Plan;
  productPlan?: ProductPlan;
  finalizedPrompt?: string;
  userConfirmed?: boolean;
  projectTitle?: string;
};
