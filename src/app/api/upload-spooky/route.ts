import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type UploadBody = { dataUrl?: string; filename?: string }

function dataUrlToParts(dataUrl: string): { mime: string; buf: Buffer } {
  const m = dataUrl.match(/^data:(?<mime>image\/[a-z0-9+.\-]+);base64,(?<b64>.+)$/i)
  if (!m?.groups?.mime || !m?.groups?.b64) throw new Error('Bad data URL')
  return { mime: m.groups.mime, buf: Buffer.from(m.groups.b64, 'base64') }
}

export async function POST(req: NextRequest) {
  try {
    const { dataUrl, filename = `spookified-${Date.now()}.png` } = (await req.json()) as UploadBody
    if (!dataUrl) return NextResponse.json({ error: 'Missing dataUrl' }, { status: 400 })

    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      return NextResponse.json(
        { error: 'Vercel Blob token missing. Set BLOB_READ_WRITE_TOKEN in .env.local.' },
        { status: 500 }
      )
    }

    const { mime, buf } = dataUrlToParts(dataUrl)
    const blob = await put(filename, buf, {
      access: 'public',
      contentType: mime,
      addRandomSuffix: true,
      token,
    })
    return NextResponse.json({ url: blob.url })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'Upload failed' }, { status: 500 })
  }
}
