import { NextRequest, NextResponse } from 'next/server'
import memStore from '@/lib/memStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type SpookifyBody = { id?: string }

function dataUrlToBuffer(dataUrl: string): Buffer {
  const m = dataUrl.match(/^data:(?<mime>image\/(?:png|jpeg|webp));base64,(?<b64>.+)$/i)
  if (!m?.groups?.b64) throw new Error('Bad data URL')
  return Buffer.from(m.groups.b64, 'base64')
}

export async function POST(req: NextRequest) {
  try {
    const { id } = (await req.json()) as SpookifyBody
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 })

    const item = memStore.get(id)
    if (!item?.dataUrl) return NextResponse.json({ error: 'Original not found' }, { status: 404 })

    const prompt =
      (item.finalizedPrompt && item.finalizedPrompt.trim()) ||
      'Tasteful Halloween version while preserving the composition; moody fog, moonlit ambience, warm candle glows, deeper shadows; add 1–3 soft white ghosts; no text; printable.'

    // Build multipart form for /v1/images/edits
    const buf = dataUrlToBuffer(item.dataUrl)

    // ✅ Create a *real* ArrayBuffer and copy the bytes over
    const ab = new ArrayBuffer(buf.byteLength)
    new Uint8Array(ab).set(buf)

    const form = new FormData()
    form.append('model', 'gpt-image-1')
    form.append('prompt', prompt)
    form.append('size', '1024x1024')
    form.append('quality', 'high')

    // Either Blob …
    form.append('image', new Blob([ab], { type: 'image/png' }), 'source.png')

    // … or File (also fine in Node 18+/undici)
    // form.append('image', new File([ab], 'source.png', { type: 'image/png' }))

    const resp = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    const json = (await resp.json()) as {
      data?: Array<{ b64_json?: string }>
      error?: { message?: string }
    }

    if (!resp.ok) {
      const msg = json?.error?.message || `OpenAI error ${resp.status}`
      return NextResponse.json({ error: msg }, { status: resp.status })
    }

    const b64 = json?.data?.[0]?.b64_json
    if (!b64) return NextResponse.json({ error: 'Image edit returned no data' }, { status: 500 })

    const previewDataUrl = `data:image/png;base64,${b64}`
    return NextResponse.json({ ok: true, id, promptUsed: prompt, previewDataUrl })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'Failed to spookify' }, { status: 500 })
  }
}
// import { NextRequest, NextResponse } from 'next/server'

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// type FixResult = {
//   blocked: true
//   reason: string
//   suggestion: string
//   note: string
// }

// async function llmRewriteToSafe(originalPrompt: string): Promise<FixResult> {
//   const apiKey = process.env.OPENAI_API_KEY!
//   const model = process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini'

//   // Ask the LLM to keep intent but ensure policy-safe wording.
//   const sys = `You are a "prompt safety fixer" for a Halloween art app.
// Rewrite the user's image prompt so it's fun and spooky but clearly SAFE for a general audience:
// - no violence, gore, graphic injuries, weapons, harm or threats
// - no sexual content
// - no realistic children in peril (only cute, cartoonish or whimsical styles)
// - avoid "zombie eyes", "blood", "injury", "corpse", "decay" phrasing
// - allow cute ghosts, pumpkins, fog, moonlight, whimsical costumes, magical vibes
// Return ONLY the rewritten prompt in one paragraph.`

//   const body = {
//     model,
//     messages: [
//       { role: 'system', content: sys },
//       { role: 'user', content: `Original prompt:\n${originalPrompt}` },
//     ],
//     temperature: 0.4,
//   }

//   const resp = await fetch('https://api.openai.com/v1/chat/completions', {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
//     body: JSON.stringify(body),
//   })
//   const json = await resp.json()
//   const suggestion = json?.choices?.[0]?.message?.content?.trim() || 'A cute, whimsical Halloween scene with friendly ghosts, soft moonlight, fog, and pastel colors.'
//   return {
//     blocked: true,
//     reason: 'Safety system rejected the original prompt.',
//     suggestion,
//     note: 'I rewrote your prompt to keep the vibe but comply with safety rules.',
//   }
// }

// // Util: parse data URL -> Buffer
// function dataUrlToBuffer(dataUrl: string) {
//   const m = dataUrl.match(/^data:(?<mime>image\/[a-z0-9+.-]+);base64,(?<b64>.+)$/i)
//   if (!m?.groups?.mime || !m?.groups?.b64) throw new Error('Bad data URL')
//   return { mime: m.groups.mime, buf: Buffer.from(m.groups.b64, 'base64') }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const apiKey = process.env.OPENAI_API_KEY!
//     if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 })

//     const { id, promptOverride } = (await req.json()) as { id: string; promptOverride?: string }
//     if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

//     // Retrieve your stored original image and finalizedPrompt however you already do it.
//     const r = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/get-image?id=${encodeURIComponent(id)}`)
//     if (!r.ok) return NextResponse.json({ error: 'Image not found' }, { status: 404 })
//     const { dataUrl, finalizedPrompt } = await r.json()
//     const prompt = promptOverride || finalizedPrompt || 'Cute whimsical Halloween makeover, friendly ghosts, moonlight, fog, pastel palette, no violence.'

//     const { buf } = dataUrlToBuffer(dataUrl)

//     // Build form for image edit
//     const form = new FormData()
//     form.append('prompt', prompt)
//     form.append('size', '1024x1024')
//     form.append('image', new File([buf], 'source.png', { type: 'image/png' }))

//     const resp = await fetch('https://api.openai.com/v1/images/edits', {
//       method: 'POST',
//       headers: { Authorization: `Bearer ${apiKey}` },
//       body: form,
//     })

//     if (!resp.ok) {
//       // Try to detect a safety block
//       const text = await resp.text()
//       const lower = text.toLowerCase()
//       const maybeSafety =
//         resp.status === 400 ||
//         lower.includes('safety') ||
//         lower.includes('violence') ||
//         lower.includes('policy')

//       if (maybeSafety) {
//         const fix = await llmRewriteToSafe(prompt)
//         // Return a "blocked" payload the client knows how to handle
//         return NextResponse.json(fix, { status: 200 })
//       }

//       return NextResponse.json({ error: 'Image generation failed', raw: text }, { status: resp.status })
//     }

//     const j = await resp.json()
//     const b64 = j?.data?.[0]?.b64_json
//     if (!b64) return NextResponse.json({ error: 'No image in response' }, { status: 502 })
//     const previewDataUrl = `data:image/png;base64,${b64}`

//     return NextResponse.json({ previewDataUrl })
//   } catch (e) {
//     return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 })
//   }
// }
