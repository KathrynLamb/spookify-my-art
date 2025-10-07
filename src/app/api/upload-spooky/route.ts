import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function dataUrlToParts(dataUrl: string) {
  const m = dataUrl.match(/^data:(?<mime>image\/[a-z0-9+.-]+);base64,(?<b64>.+)$/i)
  if (!m?.groups?.mime || !m?.groups?.b64) throw new Error('Bad data URL')
  return { mime: m.groups.mime, buf: Buffer.from(m.groups.b64, 'base64') }
}

export async function POST(req: NextRequest) {
  try {
    const { dataUrl, filename = `spookified-${Date.now()}.png` } = await req.json()
    if (!dataUrl) return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 })
    const { mime, buf } = dataUrlToParts(dataUrl)

    const blob = await put(filename, buf, {
      access: 'public',
      contentType: mime,
      addRandomSuffix: true,
    })
    return NextResponse.json({ url: blob.url })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 })
  }
}
