// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { upsertItem } from '@/lib/memStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// ---- Types ----
type Role = 'user' | 'assistant'
type SystemRole = 'system'
type AllRoles = Role | SystemRole

export interface ChatMsg {
  role: Role
  content?: string
  images?: string[] // http(s) URLs or data URLs (png/jpg)
}

export interface ChatRequestBody {
  id: string
  messages: ChatMsg[]
}

export type Plan = Record<string, unknown> & {
  spookiness?: number
  vibe?: string
  elements?: string[]
  palette?: string
  avoid?: string[]
  textOverlay?: string
  finalizedPrompt?: string
}

// ---- System Prompt ----
const SYSTEM_PROMPT = `
You are **Spookify Stylist**—a playful, tasteful Halloween art assistant that reacts to the user's uploaded image, then helps them co-create a plan to "spookify" it for print.

**Core Behavior**
- If an image is provided, open with a warm greeting + ONE specific, observant compliment about the photo (composition, light, subject, colors, or vibe). Make it feel like you truly saw the picture.
- Follow with a short, inviting nudge that you have ideas brewing—and ask what direction they’re feeling (cute & cozy, moonlit & mysterious, gothic, whimsical). Conversational, not a form.
- Ask only the minimum needed questions (1–3): vibe, spookiness (1–5), elements (ghosts/fog/moon/pumpkins/shadows), palette, avoid list, optional single-line text overlay.
- Keep tone fun, lightly punny, and encouraging, but never cheesy. Prioritize taste and printability.

**Image Intent**
- Preserve original composition, subjects, pose, and general lighting direction.
- Integrate costumes/props/atmosphere naturally (occlusion, contact shadows, real materials). Avoid sticker/overlay look.

**Safety & Taste**
- Family-safe. No gore or graphic content. No added real people. No logos/watermarks. No text unless the user asks for a tasteful single-line overlay.

**Output Contract**
After your natural reply (friendly chat text), ALWAYS append a fenced JSON block with a single CONFIG object:

\`\`\`json
{
  "spookiness": 1,
  "vibe": "moody | whimsical | gothic | cute",
  "elements": ["fog","soft white ghost","crescent moon"],
  "palette": "cool moonlit blues with warm candle glows",
  "avoid": ["blood","gore"],
  "textOverlay": "",
  "finalizedPrompt": "One concise paragraph that instructs the image model to preserve the original composition/subjects/pose/light-direction of the reference image, apply the selected vibe/palette/spookiness, integrate the chosen elements realistically (no sticker look), and include or explicitly forbid text according to textOverlay. Keep it photorealistic, printable, tasteful, and identity-preserving. Negative: no illustration, no cartoon, no vector, no sticker, no watermark, no logo, no frame/border, no gore."
}
\`\`\`

**Voice**
- Small, subtle spooky puns welcome. Be concise, confident, and kind.
`.trim()

// ---- Helpers ----
function tryParseJSON<T>(text: string): T | null {
  let m: RegExpMatchArray | null = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/)
  if (!m) {
    const all = text.match(/\{[\s\S]*\}/g)
    if (all && all.length) m = ['', all[all.length - 1]] as unknown as RegExpMatchArray
  }
  if (!m) return null
  try {
    return JSON.parse(m[1]) as T
  } catch {
    return null
  }
}

// Convert our message to OpenAI chat format.
// For multimodal, content is an array of {type:'text'} and {type:'image_url'} parts.
function toOpenAIMessage(
  m: ChatMsg | { role: SystemRole; content: string }
): OpenAI.Chat.Completions.ChatCompletionMessageParam {
  // System message
  if ('role' in m && m.role === 'system') {
    return { role: 'system', content: m.content }
  }

  const msg = m as ChatMsg
  const text = (msg.content ?? '').trim()

  if (msg.role === 'user') {
    // Build parts for the USER (text + optional images)
    const parts: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []

    if (text) {
      parts.push({ type: 'text', text })
    } else if (msg.images?.length) {
      // tiny hint so content isn't empty when only images are sent
      parts.push({ type: 'text', text: 'Please analyze the attached image.' })
    }

    if (Array.isArray(msg.images)) {
      for (const url of msg.images) {
        if (typeof url === 'string' && url.length > 0) {
          parts.push({ type: 'image_url', image_url: { url } })
        }
      }
    }

    return {
      role: 'user',
      content: parts.length > 0 ? parts : '',
    } satisfies OpenAI.Chat.Completions.ChatCompletionUserMessageParam
  }

  // ASSISTANT: must not include image parts, pass plain text
  return {
    role: 'assistant',
    content: text || '',
  } satisfies OpenAI.Chat.Completions.ChatCompletionAssistantMessageParam
}


// ---- Route ----
export async function POST(req: NextRequest) {
  try {
    const { id, messages } = (await req.json()) as ChatRequestBody
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages must be an array' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 })

    const openai = new OpenAI({ apiKey })

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o',            // vision-capable
      temperature: 0.6,
      messages: [
        { role: 'system' as AllRoles, content: SYSTEM_PROMPT },
        ...messages.map(toOpenAIMessage),
      ],
    })

    const content = chat.choices?.[0]?.message?.content ?? 'Sorry, no response.'
    const plan = tryParseJSON<Plan>(content)
    const finalizedPrompt = plan?.finalizedPrompt

    upsertItem(id, { plan, finalizedPrompt })

    return NextResponse.json({ content, plan, finalizedPrompt })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
