
import { NextRequest, NextResponse } from 'next/server'
import memStore from '@/lib/memStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') || ''
  const item = memStore.get(id)
  if (!item?.dataUrl) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    id,
    dataUrl: item.dataUrl,
    plan: item.plan || null,
    finalizedPrompt: item.finalizedPrompt || null
  })
}
