
// import { NextRequest, NextResponse } from 'next/server';
// import OpenAI from 'openai';
// import { upsertItem } from '@/lib/memStore';
// import { buildSystemPromptForDesign } from '@/lib/ai/prompts/productPrompt';
// import { CATALOG } from '@/lib/catalog';

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// type Role = 'user' | 'assistant';
// type Orientation = 'Horizontal' | 'Vertical' | 'Square';

// type ChatMsg = { role: Role; content?: string; images?: string[] };
// type PromptMode = 'spookify' | 'jollyfy' | 'lovify' | 'custom';

// type Plan = {
//   vibe?: string;
//   elements?: string[];
//   palette?: string;
//   avoid?: string[];
//   textOverlay?: string;
//   orientation: Orientation;            // required
//   finalizedPrompt: string;             // required
// };

// type ProductPlan = {
//   productId: string | null;            // null when asking a clarifier
//   reasonShort?: string;
// };

// type ChatBody = {
//   id: string;                          // imageId
//   mode?: PromptMode;
//   messages: ChatMsg[];
// };

// function extractJsonFence(text: string): any | null {
//   const m = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/```\s*([\s\S]*?)\s*```/i);
//   const payload = m?.[1];
//   if (!payload) return null;
//   try { return JSON.parse(payload); } catch { return null; }
// }

// function normalizeOrientation(v: unknown): Orientation | null {
//   const s = String(v ?? '').toLowerCase();
//   if (/(horizontal|landscape|wide|16:9|3:2|postcard)/.test(s)) return 'Horizontal';
//   if (/(vertical|portrait|tall|2:3)/.test(s)) return 'Vertical';
//   if (/(square|1:1)/.test(s)) return 'Square';
//   return null;
// }

// // Ensure product exists and supports the orientation.
// function coerceProductPlan(pp: ProductPlan | null | undefined, o: Orientation) {
//   if (!pp || !pp.productId) return { productId: null, reasonShort: pp?.reasonShort ?? 'Do you want this as a card to send, or a wall print to keep?' };
//   const found = CATALOG.find(c => c.productId === pp.productId);
//   if (!found) {
//     return { productId: null, reasonShort: 'I need to confirm the product type (card vs framed print vs canvas).' };
//   }
//   if (!found.orientations.includes(o)) {
//     return { productId: null, reasonShort: `That product doesn’t match ${o}. Should we switch orientation or pick another product?` };
//   }
//   return { productId: found.productId, reasonShort: pp.reasonShort ?? '' };
// }

// /** Convert our chat message to OpenAI chat-completions message */
// function toOpenAIMessage(m: ChatMsg | { role: 'system'; content: string }): OpenAI.Chat.Completions.ChatCompletionMessageParam {
//   if (m.role === 'system') return { role: 'system', content: m.content };
//   const text = (m.content ?? '').trim();
//   if (m.role === 'user') {
//     const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
//     if (text) parts.push({ type: 'text', text });
//     if (m.images?.length) for (const url of m.images) parts.push({ type: 'image_url', image_url: { url } });
//     return { role: 'user', content: parts.length ? parts : [{ type: 'text', text: '' }] };
//   }
//   return { role: 'assistant', content: text };
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { id, mode = 'custom', messages } = (await req.json()) as ChatBody;
//     if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
//     if (!Array.isArray(messages)) return NextResponse.json({ error: 'messages must be array' }, { status: 400 });

//     const apiKey = process.env.OPENAI_API_KEY;
//     if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 });

//     const openai = new OpenAI({ apiKey });
//     const systemPrompt = buildSystemPromptForDesign(mode);

//     const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
//       { role: 'system', content: systemPrompt },
//       ...messages.map(toOpenAIMessage),
//     ];

//     const chat = await openai.chat.completions.create({
//       model: 'gpt-4o',
//       temperature: 0.6,
//       messages: openaiMessages,
//     });

//     const full = chat.choices?.[0]?.message?.content ?? '';
//     const json = extractJsonFence(full);

//     // Minimal, defensive validation
//     if (!json || typeof json !== 'object' || !json.plan) {
//       return NextResponse.json({ content: full, error: 'No JSON plan found' }, { status: 200 });
//     }

//     const orientation = normalizeOrientation(json.plan?.orientation) as Orientation | null;
//     const finalizedPrompt = String(json.plan?.finalizedPrompt ?? '').trim();

//     if (!orientation) {
//       return NextResponse.json({ content: full, error: 'orientation missing' }, { status: 200 });
//     }
//     if (!finalizedPrompt) {
//       return NextResponse.json({ content: full, error: 'finalizedPrompt missing' }, { status: 200 });
//     }

//     const plan: Plan = {
//       vibe: json.plan?.vibe ?? undefined,
//       elements: Array.isArray(json.plan?.elements) ? json.plan.elements : undefined,
//       palette: json.plan?.palette ?? undefined,
//       avoid: Array.isArray(json.plan?.avoid) ? json.plan.avoid : undefined,
//       textOverlay: json.plan?.textOverlay ?? undefined,
//       orientation,
//       finalizedPrompt,
//     };

//     const productPlan = coerceProductPlan(json.productPlan as ProductPlan | undefined, orientation);

//     // persist for later fetch (/api/get-plan etc)
//     upsertItem(id, { plan, productPlan });

//     return NextResponse.json({
//       content: full.replace(/```json[\s\S]*?```/gi, '').trim(), // human reply without the fence
//       plan,
//       productPlan,
//       finalizedPrompt: plan.finalizedPrompt, // for old clients
//     });
//   } catch (err) {
//     const message = err instanceof Error ? err.message : String(err);
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }
// ./src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { upsertItem } from '@/lib/memStore';
import { buildSystemPromptForDesign } from '@/lib/ai/prompts/productPrompt';
import { CATALOG } from '@/lib/catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Role = 'user' | 'assistant';
type Orientation = 'Horizontal' | 'Vertical' | 'Square';
type PromptMode = 'spookify' | 'jollyfy' | 'lovify' | 'custom';

type ChatMsg = { role: Role; content?: string; images?: string[] };

type Plan = {
  vibe?: string;
  elements?: string[];
  palette?: string;
  avoid?: string[];
  textOverlay?: string;
  orientation: Orientation;     // required
  finalizedPrompt: string;      // required
};

type ProductPlan = {
  productId: string | null;     // null when asking a clarifier
  reasonShort?: string;
};

type ChatBody = {
  id: string;                   // imageId
  mode?: PromptMode;
  messages: ChatMsg[];
};

// -------- type guards & helpers (no any) ------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function extractJsonFence(text: string): unknown | null {
  const m =
    text.match(/```json\s*([\s\S]*?)\s*```/i) ??
    text.match(/```\s*([\s\S]*?)\s*```/i);
  const payload = m?.[1];
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function normalizeOrientation(v: unknown): Orientation | null {
  const s = String(v ?? '').toLowerCase();
  if (/(horizontal|landscape|wide|16:9|3:2|postcard)/.test(s)) return 'Horizontal';
  if (/(vertical|portrait|tall|2:3)/.test(s)) return 'Vertical';
  if (/(square|1:1)/.test(s)) return 'Square';
  return null;
}

function coerceProductPlan(pp: unknown, o: Orientation): ProductPlan {
  if (!isRecord(pp)) {
    return { productId: null, reasonShort: 'Do you want this as a card to send, or a wall print to keep?' };
  }
  const productId = typeof pp.productId === 'string' ? pp.productId : null;
  const reasonShort = typeof pp.reasonShort === 'string' ? pp.reasonShort : undefined;

  if (!productId) return { productId: null, reasonShort: reasonShort ?? 'I need the product type (card vs wall print).' };

  const found = (CATALOG as Array<{ productId: string; orientations: Orientation[] }>).find(
    c => c.productId === productId
  );
  if (!found) return { productId: null, reasonShort: 'That product id is not available. Pick a type.' };
  if (!found.orientations.includes(o)) {
    return { productId: null, reasonShort: `That product doesn’t match ${o}. Switch orientation or pick another product?` };
  }
  return { productId: found.productId, reasonShort: reasonShort ?? '' };
}

/** Convert our chat message to OpenAI chat-completions message */
function toOpenAIMessage(
  m: ChatMsg | { role: 'system'; content: string }
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  if (m.role === 'system') return { role: 'system', content: m.content };

  const text = (m.content ?? '').trim();
  if (m.role === 'user') {
    const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    if (text) parts.push({ type: 'text', text });
    if (m.images?.length) {
      for (const url of m.images) {
        parts.push({ type: 'image_url', image_url: { url } });
      }
    }
    return { role: 'user', content: parts.length ? parts : [{ type: 'text', text: '' }] };
  }
  return { role: 'assistant', content: text };
}

// -----------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const { id, mode = 'custom', messages } = (await req.json()) as ChatBody;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages must be array' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 });

    const openai = new OpenAI({ apiKey });
    const systemPrompt = buildSystemPromptForDesign(mode);

    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(toOpenAIMessage),
    ];

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.6,
      messages: openaiMessages,
    });

    const full = chat.choices?.[0]?.message?.content ?? '';

    // Parse fenced JSON, then validate/normalize
    const raw = extractJsonFence(full);
    if (!isRecord(raw) || !isRecord(raw.plan)) {
      return NextResponse.json({ content: full, error: 'No JSON plan found' }, { status: 200 });
    }

    const planObj = raw.plan;

    const orientation = normalizeOrientation(planObj.orientation);
    const finalizedPrompt = typeof planObj.finalizedPrompt === 'string'
      ? planObj.finalizedPrompt.trim()
      : '';

    if (!orientation) {
      return NextResponse.json({ content: full, error: 'orientation missing' }, { status: 200 });
    }
    if (!finalizedPrompt) {
      return NextResponse.json({ content: full, error: 'finalizedPrompt missing' }, { status: 200 });
    }

    const plan: Plan = {
      vibe: typeof planObj.vibe === 'string' ? planObj.vibe : undefined,
      elements: Array.isArray(planObj.elements) ? planObj.elements.filter(x => typeof x === 'string') as string[] : undefined,
      palette: typeof planObj.palette === 'string' ? planObj.palette : undefined,
      avoid: Array.isArray(planObj.avoid) ? planObj.avoid.filter(x => typeof x === 'string') as string[] : undefined,
      textOverlay: typeof planObj.textOverlay === 'string' ? planObj.textOverlay : undefined,
      orientation,
      finalizedPrompt,
    };

    const productPlan = coerceProductPlan(raw.productPlan, orientation);

    // persist for later fetch (/api/get-plan etc)
    upsertItem(id, { plan, productPlan });

    return NextResponse.json({
      content: full.replace(/```json[\s\S]*?```/gi, '').trim(), // human reply without the fence
      plan,
      productPlan,
      finalizedPrompt: plan.finalizedPrompt, // for old clients
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
