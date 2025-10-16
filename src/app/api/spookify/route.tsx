// src/app/api/spookify/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Meta = {
  fileUrl: string
  bytes?: number
  mime?: string
  finalizedPrompt?: string
  createdAt?: number
  version?: number
}

const DEFAULT_PROMPT =
  'Tasteful Halloween version while preserving the composition; moody fog, moonlit ambience, warm candle glow; 1–3 soft white friendly ghosts; no text; printable; no gore.'

// Safety prompt fixer (same behavior as before)
async function llmRewriteToSafe(originalPrompt: string): Promise<{
  blocked: true; reason: string; suggestion: string; note: string
}> {
  const apiKey = process.env.OPENAI_API_KEY!
  const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'
  const sys = `You are a "prompt safety fixer" for a Halloween art app.
Rewrite the user's image prompt so it's fun and spooky but SAFE for a general audience:
- no violence, gore, graphic injuries, weapons, threats
- no sexual content
- no realistic children in peril (only cute/whimsical styles)
- avoid words like zombie eyes, blood, injury, corpse, decay
- allow cute ghosts, pumpkins, fog, moonlight, whimsical costumes, magical vibes
Return ONLY the rewritten prompt in one paragraph.`

  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: sys },
        { role: 'user', content: `Original prompt:\n${originalPrompt}` },
      ],
      temperature: 0.4,
    }),
  })

  const json = await resp.json()
  const suggestion =
    json?.choices?.[0]?.message?.content?.trim()
    || 'A cute, whimsical Halloween scene with friendly ghosts, soft moonlight, and gentle fog.'

  return {
    blocked: true,
    reason: 'Safety system rejected the original prompt.',
    suggestion,
    note: 'I rewrote your prompt to keep the vibe but comply with safety rules.',
  }
}

// Build the public meta.json URL from an imageId and a known path layout used in upload-original
function metaUrlFrom(imageId: string) {
  // Your upload wrote to: spookify/{imageId}/original.(png|jpg)
  // and a sidecar:       spookify/{imageId}/meta.json
  // Vercel Blob public base is embedded in the fileUrl we stored; here we fetch meta directly by path.
  // If you prefer, you can keep metaUrl in client/local state when you upload and pass it in.
  // But we can derive it from the known path structure:
  // We'll fetch meta.json by listing the same host from the final fileUrl after we get it.
  // Since we don't know the host here yet, we first fetch meta.json by relative path from your Blob domain is not known.
  // Instead: we’ll fetch meta.json AFTER we know the blob host by first building a canonical path below.
  // -> We actually need the host. Easiest: try both png and jpg meta paths with your project’s default Blob base if configured.
  // Simpler: let the client send { imageId } only, and we’ll attempt both:
  //   https://blob.vercel-storage.com/spookify/{id}/meta.json  (replace with your actual base if you have one)
  // If you have NEXT_PUBLIC_BLOB_BASE_URL, use it:
  const base = process.env.NEXT_PUBLIC_BLOB_BASE_URL // e.g. https://<your-bucket>.public.blob.vercel-storage.com
  if (!base) return null
  return `${base.replace(/\/+$/,'')}/spookify/${imageId}/meta.json`
}

export async function POST(req: NextRequest) {
  try {
    const { id, imageId: idAlt, promptOverride } =
      (await req.json()) as { id?: string; imageId?: string; promptOverride?: string }

    const imageId = idAlt || id
    if (!imageId) return NextResponse.json({ error: 'Missing imageId' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 })

    // 1) Load meta.json from Blob
    // You must set NEXT_PUBLIC_BLOB_BASE_URL to your public Blob base URL, e.g.:
    // https://<your-bucket>.public.blob.vercel-storage.com
    const metaUrl = metaUrlFrom(imageId)
    if (!metaUrl) {
      return NextResponse.json({
        error: 'Missing NEXT_PUBLIC_BLOB_BASE_URL for meta.json lookup',
      }, { status: 500 })
    }

    const metaRes = await fetch(metaUrl)
    if (!metaRes.ok) {
      return NextResponse.json({ error: 'Original not found (meta missing)' }, { status: 404 })
    }
    const meta = (await metaRes.json()) as Meta
    const fileUrl = meta?.fileUrl
    if (!fileUrl) return NextResponse.json({ error: 'Original not found (no fileUrl)' }, { status: 404 })

    // 2) Fetch original bytes
    const imgRes = await fetch(fileUrl)
    if (!imgRes.ok) {
      const raw = await imgRes.text().catch(() => '')
      return NextResponse.json({ error: 'Could not fetch original', raw }, { status: 400 })
    }
    const srcBlob = await imgRes.blob()

    // 3) Choose prompt: override -> saved -> default
    const prompt =
      (promptOverride && promptOverride.trim())
      || (meta.finalizedPrompt && meta.finalizedPrompt.trim())
      || DEFAULT_PROMPT

    // 4) Call OpenAI Images Edits
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

    // 5) Handle safety / policy
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

    // 6) Return the preview data URL
    const json = (await resp.json()) as { data?: Array<{ b64_json?: string }> }
    const b64 = json?.data?.[0]?.b64_json
    if (!b64) return NextResponse.json({ error: 'Image edit returned no data' }, { status: 500 })

    return NextResponse.json({
      ok: true,
      id: imageId,
      promptUsed: prompt,
      previewDataUrl: `data:image/png;base64,${b64}`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'Failed to spookify' }, { status: 500 })
  }
}
