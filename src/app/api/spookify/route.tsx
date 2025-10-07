
import { NextRequest, NextResponse } from 'next/server'
import memStore from '@/lib/memStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function dataUrlToBuffer(dataUrl: string) {
  const m = dataUrl.match(/^data:(?<mime>image\/(?:png|jpeg|webp));base64,(?<b64>.+)$/i)
  if (!m?.groups?.b64) throw new Error('Bad data URL')
  return Buffer.from(m.groups.b64, 'base64')
}

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json() as { id: string }
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 503 })

    const item = memStore.get(id)
    if (!item?.dataUrl) return NextResponse.json({ error: 'Original not found' }, { status: 404 })

    // Use the exact prompt produced by chat
    const prompt = (item.finalizedPrompt || '').trim() || (
      'Tasteful Halloween version while preserving the composition; moody fog, moonlit ambience, warm candle glows, deeper shadows; add 1–3 soft white ghosts; no text; printable.'
    )

    // Build multipart form for /v1/images/edits
    const buf = dataUrlToBuffer(item.dataUrl)
    const form = new FormData()
    form.append('model', 'gpt-image-1')
    form.append('prompt', prompt)
    form.append('size', '1024x1024')
    form.append('quality', 'high')
    form.append('image', new Blob([buf], { type: 'image/png' }), 'source.png')

    const resp = await fetch('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
    })

    const json = await resp.json()
    if (!resp.ok) {
      const msg = json?.error?.message || `OpenAI error ${resp.status}`
      return NextResponse.json({ error: msg }, { status: resp.status })
    }

    const b64 = json?.data?.[0]?.b64_json
    if (!b64) return NextResponse.json({ error: 'Image edit returned no data' }, { status: 500 })

    const previewDataUrl = `data:image/png;base64,${b64}`
    return NextResponse.json({ ok: true, id, promptUsed: prompt, previewDataUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to spookify' }, { status: 500 })
  }
}
