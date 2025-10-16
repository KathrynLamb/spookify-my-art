// src/app/api/upload-original/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
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
    const base = `spookify/${id}`
    const imgPath = `${base}/original.${ext}`
    const metaPath = `${base}/meta.json`

    // Save the original (public so OpenAI/Gelato can fetch it)
    const img = await put(imgPath, file.stream(), {
      access: 'public',
      contentType: file.type || 'image/jpeg',
      addRandomSuffix: false,
    })

    // Save a sidecar metadata file next to it
    const meta = {
      fileUrl: img.url,
      bytes: file.size,
      mime: file.type || 'image/jpeg',
      finalizedPrompt,
      createdAt: Date.now(),
      version: 1,
    }
    await put(metaPath, JSON.stringify(meta), {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false,
    })

    // Return both ids + canonical URLs
    return NextResponse.json({
      imageId: id,
      fileUrl: img.url,
      metaUrl: img.url.replace(/original\.\w+$/, 'meta.json'),
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
