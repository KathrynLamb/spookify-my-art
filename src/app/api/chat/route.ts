import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import memStore, { upsertItem } from '@/lib/memStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper: try to pull a JSON object from the assistant text
function extractConfigFrom(text: string) {
  let m = text.match(/```json\s*([\s\S]*?)\s*```/i)
  if (!m) m = text.match(/```\s*([\s\S]*?)\s*```/)
  if (!m) {
    const all = text.match(/\{[\s\S]*\}/g)
    if (all && all.length) m = [ '', all[all.length - 1] ] as any
  }
  if (!m) return null
  try { return JSON.parse(m[1]) } catch { return null }
}

// Merge assistant CONFIG with any prior plan for this id
function normalizePlan(input: any = {}, prev: any = {}) {
  const plan = { ...prev, ...input }

  // defaults
  if (plan.spookiness == null) plan.spookiness = 3
  if (!plan.vibe) plan.vibe = 'moody'
  if (!Array.isArray(plan.elements)) plan.elements = ['soft white ghost']
  if (!plan.palette) plan.palette = 'cool moonlit blues with warm candle glows'
  if (!Array.isArray(plan.avoid)) plan.avoid = ['blood','gore']
  if (plan.textOverlay == null) plan.textOverlay = ''

  // clean up
  plan.spookiness = Math.max(1, Math.min(5, Number(plan.spookiness) || 3))
  plan.elements = Array.from(new Set(plan.elements.map((e: any) => String(e).trim()).filter(Boolean)))
  plan.avoid = Array.from(new Set(plan.avoid.map((e: any) => String(e).trim()).filter(Boolean)))
  plan.vibe = String(plan.vibe).trim()
  plan.palette = String(plan.palette).trim()
  plan.textOverlay = String(plan.textOverlay || '').trim()

  return plan
}

// Build a concrete, image-ready prompt (no placeholders)
function buildPrompt(plan: any) {
  const parts: string[] = []

  // Always anchor to reference composition
  parts.push(
    'Keep the exact composition and layout of the reference image; preserve subject placement, perspective, and framing.'
  )

  // Vibe, palette, spookiness
  parts.push(`Overall vibe: ${plan.vibe}. Spookiness: ${plan.spookiness}/5.`)
  parts.push(`Color/lighting palette: ${plan.palette}.`)

  // Elements
  if (plan.elements?.length) {
    parts.push(
      `Add only these subtle elements: ${plan.elements.join(', ')}. Limit to 1–3 total and integrate naturally into the background and lighting.`
    )
  }

  // If user explicitly said “exactly the same + ghost in the background”, reflect it:
  // (This will often be captured by plan.elements, but we reinforce it safely.)
  if (plan.elements?.some((e: string) => /ghost/i.test(e))) {
    parts.push('Render the ghost as a semi-transparent, soft-edged figure in the distant background; avoid covering key subjects.')
  }

  // Avoids
  if (plan.avoid?.length) {
    parts.push(`Do not include: ${plan.avoid.join(', ')}.`)
  }

  // Text policy
  if (plan.textOverlay) {
    parts.push(
      `Add a single tasteful text overlay that reads "${plan.textOverlay}". Place it subtly and ensure legibility without overpowering the art.`
    )
  } else {
    parts.push('No text or lettering of any kind.')
  }

  // Quality / style guardrails
  parts.push(
    'Maintain natural grain and detail, printable quality, no heavy artifacts. Avoid adding new human figures or faces. No logos or watermarks.'
  )

  return parts.join(' ')
}

const SYSTEM_PROMPT = `
You are "Spookify Stylist"—a concise, friendly assistant that helps plan how to spookify the user's uploaded art.

RESPONSE FORMAT (every single reply):
1) A short natural message (questions or confirmation are fine).
2) Then ALWAYS include a fenced JSON block named CONFIG (even if still clarifying) with these fields:

\`\`\`json
{
  "spookiness": 1,
  "vibe": "moody | whimsical | gothic | cute",
  "elements": ["soft white ghost", "fog", "crescent moon"],
  "palette": "cool moonlit blues with warm candle glows",
  "avoid": ["blood","gore"],
  "textOverlay": "",
  "finalizedPrompt": "One concise paragraph that DIRECTLY instructs an image model (no placeholders). It must say: keep the composition of the reference image; apply the selected vibe, palette, and spookiness; add ONLY the selected elements; obey the avoid list; include textOverlay only if provided (otherwise say no text)."
}
\`\`\`

Guidelines:
- Keep the reference composition/layout intact.
- Subtle, tasteful Halloween mood; 1–3 added elements max.
- No new real people; no gore by default unless requested.
`

export async function POST(req: NextRequest) {
  try {
    const { id, messages } = await req.json() as {
      id: string,
      messages: Array<{ role: 'user'|'assistant', content: string }>
    }
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 })

    const openai = new OpenAI({ apiKey })

    // Pull prior plan (to merge incremental choices)
    const prev = memStore.get(id)?.plan || {}

    const chat = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.5,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(messages || [])
      ]
    })

    const content = chat.choices?.[0]?.message?.content || 'Sorry, no response.'
    console.log("CONTENT", content)
    const parsed = extractConfigFrom(content) || {}
    const plan = normalizePlan(parsed, prev)

    // If model didn’t populate finalizedPrompt, build it server-side
    let finalizedPrompt = (parsed.finalizedPrompt || '').toString().trim()
    if (!finalizedPrompt) {
      finalizedPrompt = buildPrompt(plan)
    }

    // Store merged plan + concrete prompt
    upsertItem(id, { plan, finalizedPrompt })

    return NextResponse.json({ content, plan, finalizedPrompt })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Chat failed' }, { status: 500 })
  }
}
