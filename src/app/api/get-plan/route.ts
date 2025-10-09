import { NextRequest, NextResponse } from 'next/server'
import memStore from '@/lib/memStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const id = new URL(req.url).searchParams.get('id') || ''
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const item = memStore.get(id)
  return NextResponse.json({ plan: item?.plan ?? null })
}
