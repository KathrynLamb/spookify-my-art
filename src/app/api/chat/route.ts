import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { upsertItem } from '@/lib/memStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Role = 'user' | 'assistant'
type SystemRole = 'system'
type AllRoles = Role | SystemRole

export interface ChatMsg {
  role: Role
  content: string
}

export interface ChatRequestBody {
  id: string
  messages: ChatMsg[]
}

// ✅ Make Plan indexable so it satisfies Record<string, unknown>
export type Plan = Record<string, unknown> & {
  spookiness?: number
  vibe?: string
  elements?: string[]
  palette?: string
  avoid?: string[]
  textOverlay?: string
  finalizedPrompt?: string
}

const SYSTEM_PROMPT = `
You are "Spookify Stylist"—a concise, friendly Halloween art assistant.
Goal: help the user describe how to spookify their uploaded artwork, then produce a clean, final prompt for the image model.

Rules:
- Ask up to 3 quick questions if needed (vibe, spookiness 1–5, elements like ghosts/fog/moon/pumpkins/shadows, palette, optional text overlay, anything to avoid).
- Keep the original composition/layout of the user's art. No added real people. No text unless user explicitly wants a tasteful overlay.
- Priority: keep composition > mood/lighting > subtle elements (1–3 ghosts max) > printable, tasteful.
- After your natural reply, ALWAYS include a fenced JSON block with CONFIG only (no commentary):

\`\`\`json
{
  "spookiness": 1,
  "vibe": "moody | whimsical | gothic | cute",
  "elements": ["fog","soft white ghost","crescent moon"],
  "palette": "cool moonlit blues with warm candle glows",
  "avoid": ["blood","gore"],
  "textOverlay": "",
  "finalizedPrompt": "One concise paragraph…"
}
\`\`\`

"finalizedPrompt" must instruct: keep the composition of the reference, apply vibe/palette/spookiness, add chosen elements, avoid text unless textOverlay set. If textOverlay is set, include a single tasteful line; otherwise forbid text.
`

function tryParseJSON<T>(text: string): T | null {
  // ```json ... ```
  let m: RegExpMatchArray | null = text.match(/```json\s*([\s\S]*?)\s*```/i)
  // ``` ... ```
  if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/)
  // last {...}
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

export async function POST(req: NextRequest) {
  try {
    const { id, messages } = (await req.json()) as ChatRequestBody

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }
    if (!Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages must be an array' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 })
    }

    const openai = new OpenAI({ apiKey })

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      messages: [
        { role: 'system' as AllRoles, content: SYSTEM_PROMPT },
        ...messages.map(m => ({ role: m.role as AllRoles, content: m.content })),
      ],
    })

    const content = chat.choices?.[0]?.message?.content ?? 'Sorry, no response.'
    const plan = tryParseJSON<Plan>(content) // Plan | null
    const finalizedPrompt = plan?.finalizedPrompt

    // ✅ Plan is now assignable to Record<string, unknown> | null
    upsertItem(id, { plan, finalizedPrompt })

    return NextResponse.json({ content, plan, finalizedPrompt })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
