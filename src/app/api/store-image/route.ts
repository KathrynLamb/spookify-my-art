// import { NextRequest, NextResponse } from 'next/server'
// import memStore, { upsertItem } from '@/lib/memStore'

// export const runtime = 'nodejs'
// export const dynamic = 'force-dynamic'

// export async function POST(req: NextRequest) {
//   try {
//     const { dataUrl } = await req.json() as { dataUrl?: string }
//     if (!dataUrl?.startsWith('data:image/')) {
//       return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
//     }
//     const id = crypto.randomUUID()
//     upsertItem(id, { dataUrl })
//     return NextResponse.json({ id })
//   } catch (e: any) {
//     return NextResponse.json({ error: e?.message || 'Store failed' }, { status: 500 })
//   }
// }
import { NextRequest, NextResponse } from 'next/server'
import { upsertItem } from '@/lib/memStore'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { dataUrl } = await req.json() as { dataUrl?: string }
    if (!dataUrl?.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image' }, { status: 400 })
    }
    const id = crypto.randomUUID()
    upsertItem(id, { dataUrl })
    return NextResponse.json({ id })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Store failed' }, { status: 500 })
  }
}
