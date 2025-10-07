import { NextRequest, NextResponse } from 'next/server'
import { upsertItem } from '@/lib/memStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type StoreBody = { dataUrl?: string }

export async function POST(req: NextRequest) {
  try {
    const { dataUrl } = (await req.json()) as StoreBody
    if (!dataUrl?.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
    }
    const id = crypto.randomUUID()
    upsertItem(id, { dataUrl })
    return NextResponse.json({ id })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg || 'Store failed' }, { status: 500 })
  }
}
