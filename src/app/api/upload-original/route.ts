// src/app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { kv } from '@vercel/kv'
import crypto from 'node:crypto'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const finalizedPrompt = (form.get('finalizedPrompt') as string) || ''
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const id = crypto.randomUUID()
  const path = `spookify/${id}/original.${file.type === 'image/png' ? 'png' : 'jpg'}`
  const putRes = await put(path, file.stream(), {
    access: 'public',
    contentType: file.type || 'image/jpeg',
    addRandomSuffix: false,
  })

  await kv.hset(`image:${id}`, {
    fileUrl: putRes.url,
    bytes: putRes.size,
    mime: putRes.contentType,
    finalizedPrompt,
    createdAt: Date.now(),
  })

  return NextResponse.json({ imageId: id, fileUrl: putRes.url })
}
