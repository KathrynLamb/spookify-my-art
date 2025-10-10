// src/app/api/gelato/catalog/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { GELATO_PRODUCT_BASE, gelatoHeaders } from '@/lib/gelato'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Minimal types if you want them
type Catalog = {
  catalogUid: string
  title: string
  productAttributes: Array<{
    productAttributeUid: string
    title: string
    values: Array<{ productAttributeValueUid: string; title: string }>
  }>
}

// type GelatoError = {
//   code?: string
//   message?: string
//   requestId?: string
//   details?: unknown[]
// }

/** Safely pull a message off an unknown JSON blob. */
function extractMessage(u: unknown): string | undefined {
  if (u && typeof u === 'object' && 'message' in u) {
    const m = (u as { message?: unknown }).message
    if (typeof m === 'string') return m
  }
  return undefined
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const uid = url.searchParams.get('uid') || 'posters'

    const resp = await fetch(
      `${GELATO_PRODUCT_BASE}/catalogs/${encodeURIComponent(uid)}`,
      { headers: gelatoHeaders() }
    )

    const text = await resp.text()
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      parsed = { raw: text }
    }

    if (!resp.ok) {
      const msg = extractMessage(parsed) || 'Gelato catalog fetch failed'
      return NextResponse.json(
        { error: msg, raw: parsed },
        { status: resp.status }
      )
    }

    // runtime validate a bit to help downstream, but don't crash if shape differs
    const catalog = parsed as Catalog
    return NextResponse.json(catalog)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
