// app/design/types.ts

// import { Plan } from "../api/chat/route";

export type Role = 'user' | 'assistant';

export type Orientation = 'Horizontal' | 'Vertical' | 'Square';

export type MockupPlacement = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type MockupSpec = {
  template: string;
  prompt?: string;

  // product-specific optional fields
  mugWidthPx?: number;
  mugHeightPx?: number;

  cushionWidthPx?: number;
  cushionHeightPx?: number;

  // ✅ make optional because cards won't have it
  placement?: MockupPlacement;
};

export type PrintSpec = {
  provider: string;
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
  panelLayout?: {
    panels: number;
    panelWidthPx: number;
    panelHeightPx: number;
  };
};

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

  mockup?: MockupSpec;

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

  shippingTime?: Record<string, string | undefined>;

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
  finalizedPrompt?: string | null;
  projectName?: string;
  referencesNeeded?: string[];   // from GPT
  references?: Reference[];      // added by uploads
  userInsideMessageDecision: boolean;
  insideMessage: string | null;

  orientation?: 'Horizontal' | 'Vertical' | 'Square' | null;
  targetAspect?: number | null;

  
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
  typing?: boolean;

}

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
  planDelta?: PlanDelta
};
export type LLMContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export type LLMMessage =
  | { role: "system"; content: string }
  | { role: "assistant"; content: string }
  | { role: "user"; content: string | LLMContentPart[] };


  export type PlanDelta = Partial<Pick<
  Plan,
  | "projectName"
  | "intent"
  | "vibe"
  | "elements"
  | "palette"
  | "avoid"
  | "textOverlay"
  | "orientation"
  | "targetAspect"
  | "references"
  | "referencesNeeded"
  | "finalizedPrompt"
  | "userConfirmed"
>>;

