// // import { NextRequest, NextResponse } from 'next/server';
// // import OpenAI from 'openai';
// // import { upsertItem } from '@/lib/memStore';
// // import { getSystemPrompt, PromptKey } from '@/lib/ai/prompts/index';

// // export const runtime = 'nodejs';
// // export const dynamic = 'force-dynamic';

// // type Role = 'user' | 'assistant';
// // type SystemRole = 'system';
// // type AllRoles = Role | SystemRole;

// // export interface ChatMsg {
// //   role: Role;
// //   content?: string;
// //   images?: string[];
// // }

// // export interface ChatRequestBody {
// //   id: string;
// //   mode?: PromptKey; // e.g. 'spookify', 'jollyfy', etc.
// //   messages: ChatMsg[];
// // }

// // /* ---------- JSON extractor ---------- */
// // function tryParseJSON<T>(text: string): T | null {
// //   const m = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/\{[\s\S]*\}/);
// //   if (!m) return null;
// //   try {
// //     return JSON.parse(Array.isArray(m) ? m[1] ?? m[0] : m[0]);
// //   } catch {
// //     return null;
// //   }
// // }

// // /* ---------- OpenAI message converter ---------- */
// // function toOpenAIMessage(
// //   m: ChatMsg | { role: SystemRole; content: string }
// // ): OpenAI.Chat.Completions.ChatCompletionMessageParam {
// //   if ('role' in m && m.role === 'system') {
// //     // System message
// //     return { role: 'system', content: m.content };
// //   }

// //   const msg = m as ChatMsg;
// //   const text = msg.content?.trim() || '';

// //   // Use concrete content-part types from the SDK (no `any`)
// //   const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = text
// //     ? [{ type: 'text', text }] // satisfies OpenAI part type
// //     : [];

// //   if (msg.images?.length) {
// //     for (const url of msg.images) {
// //       parts.push({
// //         type: 'image_url',
// //         image_url: { url },
// //       } as OpenAI.Chat.Completions.ChatCompletionContentPart);
// //     }
// //   }

// //   return {
// //     role: msg.role,
// //     content: parts.length ? parts : [{ type: 'text', text: '' }],
// //   };
// // }

// // /* ---------- Route ---------- */
// // export async function POST(req: NextRequest) {
// //   try {
// //     const { id, mode = 'spookify', messages } = (await req.json()) as ChatRequestBody;
// //     if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
// //     if (!Array.isArray(messages)) return NextResponse.json({ error: 'messages must be array' }, { status: 400 });

// //     const apiKey = process.env.OPENAI_API_KEY;
// //     if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 });

// //     const openai = new OpenAI({ apiKey });

// //     const systemPrompt = getSystemPrompt(mode);

// //     const chat = await openai.chat.completions.create({
// //       model: 'gpt-4o',
// //       temperature: 0.6,
// //       messages: [
// //         { role: 'system' as AllRoles, content: systemPrompt },
// //         ...messages.map(toOpenAIMessage),
// //       ],
// //     });

// //     const fullContent = chat.choices?.[0]?.message?.content ?? '';
// //     const plan = tryParseJSON<Record<string, unknown>>(fullContent);
// //     const contentWithoutJson = fullContent.replace(/```json[\s\S]*?```/, '').trim();

// //     upsertItem(id, { plan });

// //     return NextResponse.json({ content: contentWithoutJson, plan });
// //   } catch (err: unknown) {
// //     const message = err instanceof Error ? err.message : String(err);
// //     return NextResponse.json({ error: message }, { status: 500 });
// //   }
// // }
// // ./src/app/api/chat/route.ts
// import { NextRequest, NextResponse } from 'next/server';
// import OpenAI from 'openai';
// import { upsertItem } from '@/lib/memStore';
// import { getSystemPrompt, type PromptKey } from '@/lib/ai/prompts';

// export const runtime = 'nodejs';
// export const dynamic = 'force-dynamic';

// type Role = 'user' | 'assistant';
// type SystemRole = 'system';

// export interface ChatMsg {
//   role: Role;
//   content?: string;
//   images?: string[];
// }

// export interface ChatRequestBody {
//   id: string;
//   mode?: PromptKey; // e.g. 'spookify', 'jollyfy', etc.
//   messages: ChatMsg[];
// }

// /* ---------- JSON extractor ---------- */
// function tryParseJSON<T>(text: string): T | null {
//   const m = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/\{[\s\S]*\}/);
//   if (!m) return null;
//   try {
//     return JSON.parse(Array.isArray(m) ? m[1] ?? m[0] : m[0]);
//   } catch {
//     return null;
//   }
// }

// /* ---------- OpenAI message converter ---------- */
// /**
//  * IMPORTANT: With Chat Completions:
//  * - user messages may be a multi-part array (text + image_url parts)
//  * - assistant messages must be plain text (string), not a parts array
//  */
// function toOpenAIMessage(
//   m: ChatMsg | { role: SystemRole; content: string }
// ): OpenAI.Chat.Completions.ChatCompletionMessageParam {
//   if (m.role === 'system') {
//     return { role: 'system', content: m.content };
//   }

//   const msg = m as ChatMsg;
//   const text = msg.content?.trim() ?? '';

//   if (msg.role === 'user') {
//     const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
//     if (text) parts.push({ type: 'text', text });
//     if (msg.images?.length) {
//       for (const url of msg.images) {
//         parts.push({ type: 'image_url', image_url: { url } });
//       }
//     }
//     // ChatCompletionUserMessageParam requires at least one part; fallback to empty text part.
//     return {
//       role: 'user',
//       content: parts.length ? parts : [{ type: 'text', text: '' }],
//     };
//   }

//   // Assistant must be plain text here.
//   return { role: 'assistant', content: text };
// }

// /* ---------- Route ---------- */
// export async function POST(req: NextRequest) {
//   try {
//     const { id, mode = 'spookify', messages } = (await req.json()) as ChatRequestBody;
//     if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
//     if (!Array.isArray(messages)) {
//       return NextResponse.json({ error: 'messages must be array' }, { status: 400 });
//     }

//     const apiKey = process.env.OPENAI_API_KEY;
//     if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 });

//     const openai = new OpenAI({ apiKey });
//     const systemPrompt = getSystemPrompt(mode);

//     const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
//       { role: 'system', content: systemPrompt },
//       ...messages.map(toOpenAIMessage),
//     ];

//     const chat = await openai.chat.completions.create({
//       model: 'gpt-4o',
//       temperature: 0.6,
//       messages: openaiMessages,
//     });

//     const fullContent = chat.choices?.[0]?.message?.content ?? '';
//     const plan = tryParseJSON<Record<string, unknown>>(fullContent);
//     const contentWithoutJson = fullContent.replace(/```json[\s\S]*?```/, '').trim();

//     upsertItem(id, { plan });
//     return NextResponse.json({ content: contentWithoutJson, plan });
//   } catch (err: unknown) {
//     const message = err instanceof Error ? err.message : String(err);
//     return NextResponse.json({ error: message }, { status: 500 });
//   }
// }
// ./src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { upsertItem } from '@/lib/memStore';
import { getSystemPrompt, type PromptKey } from '@/lib/ai/prompts/index';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Role = 'user' | 'assistant';
type SystemRole = 'system';

export interface ChatMsg {
  role: Role;
  content?: string;
  images?: string[];
}

export interface ChatRequestBody {
  id: string;
  mode?: PromptKey; // 'spookify' | 'jollyfy' | ...
  messages: ChatMsg[];
}

/* ---------- JSON extractor ---------- */
function tryParseJSON<T>(text: string): T | null {
  const fence = text.match(/```json\s*([\s\S]*?)\s*```/i);
  const raw = fence ? fence[1] : (text.match(/\{[\s\S]*\}/)?.[0] ?? null);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/* ---------- OpenAI message converter ----------
   Chat Completions rules:
   - user may send an array of content parts (text + image_url)
   - assistant should be a plain string message
------------------------------------------------- */
function toOpenAIMessage(
  m: ChatMsg | { role: SystemRole; content: string }
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  if (m.role === 'system') {
    return { role: 'system', content: m.content };
  }

  const msg = m as ChatMsg;
  const text = (msg.content ?? '').trim();

  if (msg.role === 'user') {
    const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [];
    if (text) parts.push({ type: 'text', text });
    if (msg.images?.length) {
      for (const url of msg.images) {
        parts.push({ type: 'image_url', image_url: { url } });
      }
    }
    return {
      role: 'user',
      content: parts.length ? parts : [{ type: 'text', text: '' }],
    };
  }

  // assistant
  return { role: 'assistant', content: text };
}

/* ---------- Route ---------- */
export async function POST(req: NextRequest) {
  try {
    const { id, mode, messages } = (await req.json()) as ChatRequestBody;

    console.log("ID", id, "Modde", mode, "messages", messages)

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!mode) return NextResponse.json({ error: 'Missing MODE' }, { status: 400 });
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages must be array' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 });

    const openai = new OpenAI({ apiKey });
    const systemPrompt = getSystemPrompt(mode);

    console.log("SYS PROMPT", systemPrompt)

    const openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(toOpenAIMessage),
    ];

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',
      temperature: 0.6,
      messages: openaiMessages,
    });

    const fullContent = chat.choices?.[0]?.message?.content ?? '';
    const plan = tryParseJSON<Record<string, unknown>>(fullContent);
    const contentWithoutJson = fullContent.replace(/```json[\s\S]*?```/gi, '').trim();

    // Persist for later use
    upsertItem(id, { plan });

    // *** Compatibility for existing UI ***
    const finalizedPrompt =
      plan && typeof plan === 'object' && 'finalizedPrompt' in plan
        ? (plan as { finalizedPrompt?: string }).finalizedPrompt ?? null
        : null;

    return NextResponse.json({
      content: contentWithoutJson,
      plan,
      finalizedPrompt, // <- legacy field expected by client UIs
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
