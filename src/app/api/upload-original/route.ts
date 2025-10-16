// src/app/api/upload-original/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { kv } from '@vercel/kv'
import crypto from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    const finalizedPrompt = (form.get('finalizedPrompt') as string) || ''
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const id = crypto.randomUUID()
    const ext = file.type === 'image/png' ? 'png' : 'jpg'
    const path = `spookify/${id}/original.${ext}`

    // Store original in Blob (public so OpenAI/Gelato can fetch)
    const putRes = await put(path, file.stream(), {
      access: 'public',
      contentType: file.type || 'image/jpeg',
      addRandomSuffix: false,
    })

    // Note: putRes has url, pathname, contentType — not size.
    await kv.hset(`image:${id}`, {
      fileUrl: putRes.url,
      bytes: file.size,                // ← use File.size
      mime: file.type || 'image/jpeg', // ← use File.type
      finalizedPrompt,
      createdAt: Date.now(),
      version: 1,
    })

    return NextResponse.json({ imageId: id, fileUrl: putRes.url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
