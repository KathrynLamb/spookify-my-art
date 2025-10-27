
// // import { NextRequest, NextResponse } from 'next/server';
// // import OpenAI from 'openai';
// // import { upsertItem } from '@/lib/memStore';

// // export const runtime = 'nodejs';
// // export const dynamic = 'force-dynamic';

// // // ---- Types ----
// // type Role = 'user' | 'assistant';
// // type SystemRole = 'system';
// // type AllRoles = Role | SystemRole;

// // export interface ChatMsg {
// //   role: Role;
// //   content?: string;
// //   images?: string[]; // http(s) URLs or data URLs (png/jpg)
// // }

// // export interface ChatRequestBody {
// //   id: string;
// //   messages: ChatMsg[];
// // }

// // export type Plan = Record<string, unknown> & {
// //   spookiness?: number;
// //   vibe?: string;
// //   elements?: string[];
// //   palette?: string;
// //   avoid?: string[];
// //   textOverlay?: string;
// //   finalizedPrompt?: string;
// //   orientation?: 'Horizontal' | 'Vertical' | 'Square';
// //   targetAspect?: number | null;
// // };

// // // ---- System Prompt ----
// // // This prompt guides the assistant to be conversational, ask the right
// // // questions, suggest ideas when the user hesitates, and produce a concise
// // // configuration object for our backend.  The JSON is appended at the end
// // // but should never be explained or shown to the end user.  The frontend
// // // strips it out before display.
// // const SYSTEM_PROMPT = `
// // You are **Spookify Stylist** — a playful, tasteful Halloween art assistant. Your job is to react to the user’s uploaded photo, help them explore a spooky transformation, and produce a concise image-generation prompt for our pipeline.

// // ## Conversation rules
// // - **If the latest user message already gives concrete direction** (e.g., “give her a traitor’s cloak and spooky traitor background”), **skip greetings and probing**. Reply with a brief acknowledgement (1 short line) and proceed to produce the plan.
// // - **Only greet / compliment the photo** when the user hasn’t stated a preference yet. Keep that opener to one concise sentence.
// // - Ask the **minimum** follow-ups only when information is missing and strictly required (vibe, spookiness 1–5, include/avoid elements, palette, optional single-line text). If the ask is already specific enough, **don’t ask questions** — just propose the plan.
// // - Keep tone fun and tasteful; reassure printability. No cheesy or overly long replies.
// // Orientation is required. If not specified, ask exactly one short question:
// // “Should the final print be landscape, portrait, or square?”
// // Do not produce a final plan until orientation is decided.
// // ## Image intent
// // - Preserve original composition, subjects, poses, and lighting direction. Pay particular attention to faces, replicate features precisely unless otherwise instructed. Adapt facial expression, however, to meet the brief, if you are uncertain on this ask the user what to do. 
// // - Never add more weight or age to a subject unless specifically requested. If you are unsure be sure to seek clarification from the user. Unless you are absolutely clear make the subjects err on the slightly flattering side. 
// // - Integrate costumes/props/atmosphere naturally with correct occlusion/contact shadows. Avoid sticker-like overlays.

// // ## Safety & taste
// // - Family-friendly: no gore or graphic violence. Do not insert real people. No logos/watermarks. Only include text if the user asks (single-line).

// // ## Output contract (hidden from the user)
// // After your visible reply, append a fenced JSON block with exactly this shape:

// // \`\`\`json
// // {
// //   "spookiness": <number 1–5>,
// //   "vibe": "<user-selected vibe>",
// //   "elements": ["<elements to include>"],
// //   "palette": "<color palette>",
// //   "avoid": ["<things to avoid>"],
// //   "textOverlay": "<optional single line or empty string>",
// //   "finalizedPrompt": "<one concise paragraph: preserve original composition/subjects/light, apply chosen vibe/palette/spookiness, integrate elements realistically (no stickers), obey avoid list, photorealistic and printable. Include or forbid text per textOverlay. Negative: no illustration, no cartoon, no vector, no sticker, no watermark, no logo, no frame/border, no gore.>",
// //   "orientation": "Horizontal | Vertical | Square",
// //   "targetAspect": <number or null>  // e.g. 1.4 for horizontal, 0.7 for vertical, 1 for square
// // }
// // \`\`\`

// // Do **not** explain the JSON; just output it after your brief reply.
// // `.trim();


// // // ---- Helpers ----
// // function tryParseJSON<T>(text: string): T | null {
// //   let m: RegExpMatchArray | null = text.match(/```json\s*([\s\S]*?)\s*```/i);
// //   if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/);
// //   if (!m) {
// //     const all = text.match(/\{[\s\S]*\}/g);
// //     if (all && all.length) m = ['', all[all.length - 1]] as unknown as RegExpMatchArray;
// //   }
// //   if (!m) return null;
// //   try {
// //     return JSON.parse(m[1]) as T;
// //   } catch {
// //     return null;
// //   }
// // }

// // // Convert our message to OpenAI chat format.
// // function toOpenAIMessage(
// //   m: ChatMsg | { role: SystemRole; content: string }
// // ): OpenAI.Chat.Completions.ChatCompletionMessageParam {
// //   // System message
// //   if ('role' in m && m.role === 'system') {
// //     return { role: 'system', content: m.content };
// //   }

// //   const msg = m as ChatMsg;
// //   const text = (msg.content ?? '').trim();

// //   if (msg.role === 'user') {
// //     // Build parts for the USER (text + optional images)
// //     const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];

// //     if (text) {
// //       parts.push({ type: 'text', text });
// //     } else if (msg.images?.length) {
// //       // tiny hint so content isn't empty when only images are sent
// //       parts.push({ type: 'text', text: 'Please analyze the attached image.' });
// //     }

// //     if (Array.isArray(msg.images)) {
// //       for (const url of msg.images) {
// //         if (typeof url === 'string' && url.length > 0) {
// //           parts.push({ type: 'image_url', image_url: { url } });
// //         }
// //       }
// //     }

// //     return {
// //       role: 'user',
// //       content: parts.length > 0 ? parts : '',
// //     } satisfies OpenAI.Chat.Completions.ChatCompletionUserMessageParam;
// //   }

// //   // ASSISTANT: must not include image parts, pass plain text
// //   return {
// //     role: 'assistant',
// //     content: text || '',
// //   } satisfies OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam;
// // }

// // // ---- Route ----
// // export async function POST(req: NextRequest) {
// //   try {
// //     const { id, messages } = (await req.json()) as ChatRequestBody;
// //     if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
// //     if (!Array.isArray(messages)) {
// //       return NextResponse.json({ error: 'messages must be an array' }, { status: 400 });
// //     }

// //     const apiKey = process.env.OPENAI_API_KEY;
// //     if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 });

// //     const openai = new OpenAI({ apiKey });

// //     const chat = await openai.chat.completions.create({
// //       model: 'gpt-4o',            // vision-capable
// //       temperature: 0.6,
// //       messages: [
// //         { role: 'system' as AllRoles, content: SYSTEM_PROMPT },
// //         ...messages.map(toOpenAIMessage),
// //       ],
// //     });

// //     const fullContent = chat.choices?.[0]?.message?.content ?? '';
// //     const plan = tryParseJSON<Plan>(fullContent);
// //     const finalizedPrompt = plan?.finalizedPrompt;
// //     // Remove the fenced JSON from the assistant reply shown to the user
// //     const contentWithoutJson = fullContent.replace(/```json[\s\S]*?```/, '').trim();

// //     upsertItem(id, { plan, finalizedPrompt });

// //     return NextResponse.json({ content: contentWithoutJson, plan, finalizedPrompt });
// //   } catch (err: unknown) {
// //     const message = err instanceof Error ? err.message : String(err);
// //     return NextResponse.json({ error: message }, { status: 500 });
// //   }
// // }
// // src/app/api/chat/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import OpenAI from 'openai';
// import { upsertItem } from '@/lib/memStore';

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// // ---- Types (same as your client) ----
// type Role = 'user' | 'assistant';
// export interface ChatMsg {
//   role: Role;
//   content?: string;
//   images?: string[]; // http(s) or data: URLs
// }
// export interface ChatRequestBody {
//   id: string;
//   messages: ChatMsg[];
// }
// export type Plan = Record<string, unknown> & {
//   spookiness?: number;
//   vibe?: string;
//   elements?: string[];
//   palette?: string;
//   avoid?: string[];
//   textOverlay?: string;
//   finalizedPrompt?: string;
//   orientation?: 'Horizontal' | 'Vertical' | 'Square';
//   targetAspect?: number | null;
// };

// // ---- Your system prompt (unchanged) ----
// const SYSTEM_PROMPT = `...` as const; // paste your SYSTEM_PROMPT exactly

// // -------- helpers --------
// function tryParseJSON<T>(text: string): T | null {
//   let m: RegExpMatchArray | null = text.match(/```json\s*([\s\S]*?)\s*```/i);
//   if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/);
//   if (!m) {
//     const all = text.match(/\{[\s\S]*\}/g);
//     if (all && all.length) m = ['', all[all.length - 1]] as unknown as RegExpMatchArray;
//   }
//   if (!m) return null;
//   try { return JSON.parse(m[1]) as T; } catch { return null; }
// }

// // Convert our ChatMsg → Responses “input” item
// function toResponsesItem(msg: ChatMsg) {
//   // Responses wants parts like {type:'input_text'} and {type:'input_image'}
//   const parts: Array<
//     | { type: 'input_text'; text: string }
//     | { type: 'input_image'; image_url: string }
//   > = [];

//   const text = (msg.content || '').trim();
//   if (text) parts.push({ type: 'input_text', text });

//   if (Array.isArray(msg.images)) {
//     for (const u of msg.images) {
//       if (typeof u === 'string' && u) {
//         parts.push({ type: 'input_image', image_url: u });
//       }
//     }
//   }

//   // Always ensure there’s at least *some* text for pure-image messages
//   if (parts.length === 0) parts.push({ type: 'input_text', text: 'Please analyze the attached image.' });

//   return { role: msg.role, content: parts };
// }

// // Pull plain text from Responses output
// function outputText(r: OpenAI.Responses.Response): string {
//   // SDK provides a helper, but we can safely derive:
//   // @ts-ignore – typed union varies by SDK version
//   if (typeof r.output_text === 'string') return r.output_text;
//   // Fallback: concatenate all text parts
//   try {
//     // @ts-ignore
//     const blocks = (r.output ?? []) as Array<any>;
//     const texts: string[] = [];
//     for (const b of blocks) {
//       if (b.type === 'output_text' && typeof b.text === 'string') texts.push(b.text);
//       if (Array.isArray(b.content)) {
//         for (const c of b.content) {
//           if (c.type === 'output_text' && typeof c.text === 'string') texts.push(c.text);
//         }
//       }
//     }
//     return texts.join('\n').trim();
//   } catch {
//     return '';
//   }
// }

// // -------- route --------
// export async function POST(req: NextRequest) {
//   const t0 = Date.now();
//   try {
//     const { id, messages } = (await req.json()) as ChatRequestBody;

//     if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
//     if (!Array.isArray(messages)) {
//       return NextResponse.json({ error: 'messages must be an array' }, { status: 400 });
//     }

//     const apiKey = process.env.OPENAI_API_KEY;
//     if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 });

//     const openai = new OpenAI({ apiKey });

//     // Build the Responses “input”:
//     // - Put your system prompt in `instructions`
//     // - Then the conversation as sequenced items
//     const input = messages.map(toResponsesItem);

//     const resp = await openai.responses.create({
//       model: 'gpt-4o', // multimodal OK
//       temperature: 0.6,
//       instructions: SYSTEM_PROMPT,
//       input, // <= sequence of { role, content:[input_text|input_image] }
//     });

//     const full = outputText(resp);
//     const plan = tryParseJSON<Plan>(full);
//     const finalizedPrompt = plan?.finalizedPrompt;

//     // Strip the fenced JSON before returning visible content
//     const contentWithoutJson = full.replace(/```json[\s\S]*?```/g, '').trim();

//     // persist
//     upsertItem(id, { plan, finalizedPrompt });

//     return NextResponse.json({ content: contentWithoutJson, plan, finalizedPrompt });
//   } catch (err) {
//     const message = err instanceof Error ? err.message : String(err);
//     // Make the offender obvious in Vercel logs
//     console.error('CHAT_FAIL', { message });
//     return NextResponse.json({ error: message }, { status: 500 });
//   } finally {
//     const ms = Date.now() - t0;
//     // Light timing log (shows up as a Warning line in Vercel)
//     console.warn(`chat route finished in ${ms}ms`);
//   }
// }
// src/app/api/chat/route.ts
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { upsertItem } from '@/lib/memStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* ======================= Types ======================= */
type Role = 'user' | 'assistant';
type SystemRole = 'system';
type AllRoles = Role | SystemRole;

export interface ChatMsg {
  role: Role;
  content?: string;
  images?: string[]; // http(s) URLs or data URLs (png/jpg)
}

export interface ChatRequestBody {
  id: string;
  messages: ChatMsg[];
}

export type Plan = Record<string, unknown> & {
  spookiness?: number;
  vibe?: string;
  elements?: string[];
  palette?: string;
  avoid?: string[];
  textOverlay?: string;
  finalizedPrompt?: string;
  orientation?: 'Horizontal' | 'Vertical' | 'Square';
  targetAspect?: number | null;
};

/* ========= Narrow content-part types for Completions ========= */
type ChatCompletionText = { type: 'text'; text: string };
type ChatCompletionImage = { type: 'image_url'; image_url: { url: string } };
type ChatCompletionUserContent = Array<ChatCompletionText | ChatCompletionImage>;

/* ======================= System Prompt ======================= */
const SYSTEM_PROMPT = `
You are **Spookify Stylist** — a playful, tasteful Halloween art assistant. Your job is to react to the user’s uploaded photo, help them explore a spooky transformation, and produce a concise image-generation prompt for our pipeline.

## Conversation rules
- **If the latest user message already gives concrete direction** (e.g., “give her a traitor’s cloak and spooky traitor background”), **skip greetings and probing**. Reply with a brief acknowledgement (1 short line) and proceed to produce the plan.
- **Only greet / compliment the photo** when the user hasn’t stated a preference yet. Keep that opener to one concise sentence.
- Ask the **minimum** follow-ups only when information is missing and strictly required (vibe, spookiness 1–5, include/avoid elements, palette, optional single-line text). If the ask is already specific enough, **don’t ask questions** — just propose the plan.
- Keep tone fun and tasteful; reassure printability. No cheesy or overly long replies.
Orientation is required. If not specified, ask exactly one short question:
“Should the final print be landscape, portrait, or square?”
Do not produce a final plan until orientation is decided.
## Image intent
- Preserve original composition, subjects, poses, and lighting direction. Pay particular attention to faces, replicate features precisely unless otherwise instructed. Adapt facial expression, however, to meet the brief, if you are uncertain on this ask the user what to do. 
- Never add more weight or age to a subject unless specifically requested. If you are unsure be sure to seek clarification from the user. Unless you are absolutely clear make the subjects err on the slightly flattering side. 
- Integrate costumes/props/atmosphere naturally with correct occlusion/contact shadows. Avoid sticker-like overlays.

## Safety & taste
- Family-friendly: no gore or graphic violence. Do not insert real people. No logos/watermarks. Only include text if the user asks (single-line).

## Output contract (hidden from the user)
After your visible reply, append a fenced JSON block with exactly this shape:

\`\`\`json
{
  "spookiness": <number 1–5>,
  "vibe": "<user-selected vibe>",
  "elements": ["<elements to include>"],
  "palette": "<color palette>",
  "avoid": ["<things to avoid>"],
  "textOverlay": "<optional single line or empty string>",
  "finalizedPrompt": "<one concise paragraph: preserve original composition/subjects/light, apply chosen vibe/palette/spookiness, integrate elements realistically (no stickers), obey avoid list, photorealistic and printable. Include or forbid text per textOverlay. Negative: no illustration, no cartoon, no vector, no sticker, no watermark, no logo, no frame/border, no gore.>",
  "orientation": "Horizontal | Vertical | Square",
  "targetAspect": <number or null>  // e.g. 1.4 for horizontal, 0.7 for vertical, 1 for square
}
\`\`\`

Do **not** explain the JSON; just output it after your brief reply.
`.trim();

/* ======================= Helpers ======================= */
function tryParseJSON<T>(text: string): T | null {
  let m: RegExpMatchArray | null = text.match(/```json\s*([\s\S]*?)\s*```/i);
  if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/);
  if (!m) {
    const all = text.match(/\{[\s\S]*\}/g);
    if (all && all.length) m = ['', all[all.length - 1]] as unknown as RegExpMatchArray;
  }
  if (!m) return null;
  try {
    return JSON.parse(m[1]) as T;
  } catch {
    return null;
  }
}

/**
 * Convert our local message shape into the OpenAI Completions chat format.
 * - System & assistant: plain text string content
 * - User: array of content parts (text + optional images)
 */
function toOpenAIMessage(
  m: ChatMsg | { role: SystemRole; content: string }
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  // System message → plain string
  if ('role' in m && m.role === 'system') {
    return { role: 'system', content: m.content };
  }

  const msg = m as ChatMsg;
  const text = (msg.content ?? '').trim();

  if (msg.role === 'user') {
    const parts: ChatCompletionUserContent = [];

    if (text) {
      parts.push({ type: 'text', text });
    } else if (msg.images?.length) {
      // tiny hint so content isn't empty when only images are sent
      parts.push({ type: 'text', text: 'Please analyze the attached image.' });
    }

    if (Array.isArray(msg.images)) {
      for (const url of msg.images) {
        if (typeof url === 'string' && url.length > 0) {
          parts.push({ type: 'image_url', image_url: { url } });
        }
      }
    }

    return {
      role: 'user',
      content: parts.length > 0 ? parts : [{ type: 'text', text: '' }],
    };
  }

  // Assistant → plain text string (do not include image parts)
  return {
    role: 'assistant',
    content: text || '',
  };
}

/* ======================= Route ======================= */
export async function POST(req: NextRequest) {
  try {
    const { id, messages } = (await req.json()) as ChatRequestBody;
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages must be an array' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 });
    }

    const openai = new OpenAI({ apiKey });

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.6,
      messages: [
        { role: 'system' as AllRoles, content: SYSTEM_PROMPT },
        ...messages.map(toOpenAIMessage),
      ],
    });

    const fullContent = chat.choices?.[0]?.message?.content ?? '';
    const plan = tryParseJSON<Plan>(fullContent);
    const finalizedPrompt = plan?.finalizedPrompt



//     // Remove the fenced JSON from the assistant reply shown to the user
   const contentWithoutJson = fullContent.replace(/```json[\s\S]*?```/, '').trim();

    upsertItem(id, { plan, finalizedPrompt });

    return NextResponse.json({ content: contentWithoutJson, plan, finalizedPrompt });
  } catch (err: unknown) {
   const message = err instanceof Error ? err.message : String(err);
   return NextResponse.json({ error: message }, { status: 500 });
  }
 }

