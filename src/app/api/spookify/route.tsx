// src/app/api/spookify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// --- Safety prompt fixer (unchanged spirit; compact) ---
async function llmRewriteToSafe(originalPrompt: string): Promise<{
  blocked: true; reason: string; suggestion: string; note: string
}> {
  const apiKey = process.env.OPENAI_API_KEY!
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'
  const sys =
    `You are a "prompt safety fixer" for a Halloween art app.
Rewrite the user's image prompt so it's fun and spooky but SAFE for a general audience:
- no violence, gore, graphic injuries, weapons, threats
- no sexual content
- no realistic children in peril (only cute/whimsical styles)
- avoid words like zombie eyes, blood, injury, corpse, decay
- allow cute ghosts, pumpkins, fog, moonlight, whimsical costumes, magical vibes
Return ONLY the rewritten prompt in one paragraph.`

  const body = {
    model,
    messages: [
      { role: 'system', content: sys },
      { role: 'user', content: `Original prompt:\n${originalPrompt}` },
    ],
    temperature: 0.4,
  }

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(body),
  })

  const json = await resp.json()
  const suggestion =
    json?.choices?.[0]?.message?.content?.trim()
      || 'A cute, whimsical Halloween scene with friendly ghosts, soft moonlight, gentle fog, and pastel colors.'

  return {
    blocked: true,
    reason: 'Safety system rejected the original prompt.',
    suggestion,
    note: 'I rewrote your prompt to keep the vibe but comply with safety rules.',
  }
}

const DEFAULT_PROMPT =
  'Tasteful Halloween version while preserving the composition; moody fog, moonlit ambience, warm candle glow; 1–3 soft white friendly ghosts; no text; printable; no gore.'

export async function POST(req: NextRequest) {
  try {
    const { id, imageId: idAlt, promptOverride } =
      (await req.json()) as { id?: string; imageId?: string; promptOverride?: string }

    const imageId = idAlt || id
    if (!imageId) return NextResponse.json({ error: 'Missing imageId' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 })

    // 1) Resolve original from KV (uploaded earlier)
    const meta = (await kv.hgetall<Record<string, string>>(`image:${imageId}`)) || {}
    const fileUrl = meta.fileUrl
    if (!fileUrl) {
      return NextResponse.json({ error: 'Original not found' }, { status: 404 })
    }

    // 2) Fetch bytes from Blob (public access assumed)
    const r = await fetch(fileUrl)
    if (!r.ok) {
      const raw = await r.text().catch(() => '')
      return NextResponse.json({ error: 'Could not fetch original', raw }, { status: 400 })
    }
    const srcBlob = await r.blob()

    // 3) Choose prompt (override -> saved -> default)
    const prompt =
      (promptOverride && promptOverride.trim())
      || (meta.finalizedPrompt && meta.finalizedPrompt.trim())
      || DEFAULT_PROMPT

    // 4) Build multipart for Image Edit
    const form = new FormData()
    form.append('model', 'gpt-image-1')
    form.append('prompt', prompt)
    form.append('size', '1024x1024')
    form.append('quality', 'high')
    form.append('image', srcBlob, 'source.png')

    const resp = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    // 5) Handle safety/policy failures with a rewrite
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      const lower = text.toLowerCase()
      const maybeSafety =
        resp.status === 400
        || lower.includes('safety')
        || lower.includes('violence')
        || lower.includes('policy')
        || lower.includes('content')

      if (maybeSafety) {
        const fix = await llmRewriteToSafe(prompt)
        return NextResponse.json(fix, { status: 200 })
      }
      return NextResponse.json({ error: 'Image generation failed', raw: text }, { status: resp.status })
    }

    // 6) Return preview data URL
    const json = (await resp.json()) as { data?: Array<{ b64_json?: string }> }
    const b64 = json?.data?.[0]?.b64_json
    if (!b64) return NextResponse.json({ error: 'Image edit returned no data' }, { status: 500 })

    const previewDataUrl = `data:image/png;base64,${b64}`
    return NextResponse.json({ ok: true, id: imageId, promptUsed: prompt, previewDataUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'Failed to spookify' }, { status: 500 })
  }
}
