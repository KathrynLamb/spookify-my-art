// src/app/api/gelato/products/route.ts
import { NextRequest, NextResponse } from 'next/server'

const PRODUCT_BASE = 'https://product.gelatoapis.com/v3' // force production


export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.GELATO_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GELATO_API_KEY' }, { status: 500 })
    }

    const url = new URL(req.url)
    const catalogUid = url.searchParams.get('catalogUid') || 'posters'
    const limit = url.searchParams.get('limit') || '50'
    const page = url.searchParams.get('page') || '1'

    // Start SMALL. Expand once you confirm which attributes your account supports.
    const allowedAttrUids = new Set(['Orientation', 'PaperFormat'])

    const qs = new URLSearchParams()
    qs.set('catalogUid', catalogUid)
    qs.set('page', page)
    qs.set('limit', limit)

    // forward only allow-listed attributes
    for (const [k, v] of url.searchParams.entries()) {
      if (allowedAttrUids.has(k) && v) qs.set(k, v)
    }

    const upstream = `${PRODUCT_BASE}/products?${qs.toString()}`
    if (process.env.NODE_ENV !== 'production') {
    }

    const resp = await fetch(upstream, {
      headers: { 'X-API-KEY': apiKey },
      cache: 'no-store',
    })

    const ctype = resp.headers.get('content-type') || ''
    const isJson = ctype.includes('application/json')
    if (process.env.NODE_ENV !== 'production') {
    }

    if (!isJson) {
      const raw = await resp.text()
      return NextResponse.json({ error: 'Upstream returned non-JSON', raw }, { status: 530 })
    }

    const data = await resp.json()
    if (!resp.ok) {
      return NextResponse.json(
        { error: data?.message || data?.error || 'Gelato products failed', raw: data },
        { status: resp.status }
      )
    }

    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
