// src/app/api/gelato/place-order/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const IS_STAGING = (process.env.GELATO_ENV || '').toLowerCase() === 'staging'
const BASE_STAGING = 'https://order-staging.gelatoapis.com/v3'
const BASE_PROD = 'https://order.gelatoapis.com/v3'

type Address = {
  name: string
  address1: string
  address2?: string | null
  city: string
  postalCode: string
  country: string
  state?: string | null
  phone?: string | null
  email?: string | null
}

type PlaceOrderBody = {
  productUid?: string
  sku?: string
  fileUrl?: string // may be http(s) or a data: URL (we will upload if needed)
  imageId?: string
  currency?: string
  address: Address
  shipmentMethodUid?: string
  attributes?: Record<string, string | number | boolean | null | undefined>
  externalOrderId?: string
}

type GelatoErrorDetails = { message?: string; reference?: string; code?: string }
type GelatoError = {
  code?: string
  message?: string
  requestId?: string
  details?: GelatoErrorDetails[]
} & Record<string, unknown>

type GelatoOk = Record<string, unknown>

function envBaseUrl(): string {
  // Prefer explicit public base; then Vercel; else localhost
  const envUrl = process.env.NEXT_PUBLIC_BASE_URL
  if (envUrl) return envUrl.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_URL
  if (vercel) return vercel.startsWith('http') ? vercel : `https://${vercel}`
  return `http://localhost:${process.env.PORT || 3000}`
}

function isHttpUrl(u: string): boolean {
  return /^https?:\/\//i.test(u)
}

async function ensureHttpFileUrl(fileUrl: string, imageId?: string): Promise<string> {
  if (!fileUrl) throw new Error('Missing fileUrl')
  if (isHttpUrl(fileUrl)) return fileUrl

  // If it’s a data: URL, upload to your blob endpoint to get a public URL
  if (fileUrl.startsWith('data:')) {
    const upUrl = `${envBaseUrl()}/api/upload-spooky`
    const filename = `gelato-${imageId || Date.now()}.png`
    const upRes = await fetch(upUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataUrl: fileUrl, filename }),
    })
    const upJson = (await upRes.json()) as { url?: string; error?: string }
    if (!upRes.ok || !upJson?.url) {
      throw new Error(upJson?.error || 'Failed to upload printable file')
    }
    return upJson.url
  }

  throw new Error('fileUrl must be http(s) or data:')
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GELATO_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GELATO_API_KEY' }, { status: 500 })
    }

    const body = (await req.json()) as PlaceOrderBody

    // prefer productUid; keep sku for backwards compatibility
    const productUid = body.productUid || body.sku
    if (!productUid) {
      return NextResponse.json({ error: 'Missing productUid' }, { status: 400 })
    }
    if (!body.address) {
      return NextResponse.json({ error: 'Missing address' }, { status: 400 })
    }
    if (!body.fileUrl) {
      return NextResponse.json({ error: 'Missing fileUrl' }, { status: 400 })
    }

    // Ensure the file URL is a publicly reachable URL
    const printableUrl = await ensureHttpFileUrl(body.fileUrl, body.imageId)

    // Build Gelato payload exactly as required
    const payload = {
      orderType: 'SalesOrder', // required allowed value
      orderReferenceId: body.externalOrderId ?? `spookify_${Date.now()}`, // required
      currency: (body.currency || 'GBP').toUpperCase(), // required

      shippingAddress: {
        // required at top level (not nested in items)
        name: body.address.name,
        address1: body.address.address1,
        address2: body.address.address2 ?? undefined,
        city: body.address.city,
        zip: body.address.postalCode,
        state: body.address.state ?? undefined,
        country: body.address.country,
        phone: body.address.phone ?? undefined,
        email: body.address.email ?? undefined,
      },

      items: [
        {
          itemReferenceId: 'line-1',
          productUid,
          quantity: 1,
          // IMPORTANT: Gelato expects fileUrl (not files[])
          fileUrl: printableUrl,
          attributes: body.attributes ?? undefined,
        },
      ],

      shipments: [
        {
          shipmentReferenceId: 'ship-1',
          shipmentMethodUid:
            body.shipmentMethodUid || process.env.GELATO_SHIPMENT_METHOD_UID || 'STANDARD',
          items: [{ itemReferenceId: 'line-1' }],
        },
      ],
    }

    const tryPost = async (
      base: string,
    ): Promise<{ ok: boolean; status: number; json: GelatoOk | GelatoError | { raw: string } }> => {
      const url = `${base}/orders`
      console.log('[Gelato] POST', url)
      const r = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey,
        },
        body: JSON.stringify(payload),
      })
      const text = await r.text()
      let json: GelatoOk | GelatoError | { raw: string }
      try {
        json = JSON.parse(text) as GelatoOk | GelatoError
      } catch {
        json = { raw: text }
      }
      return { ok: r.ok, status: r.status, json }
    }

    // Use staging if configured, and fallback to prod on 5xx/Cloudflare 530.
    let res = await tryPost(IS_STAGING ? BASE_STAGING : BASE_PROD)
    if (!res.ok && IS_STAGING && (res.status >= 500 || res.status === 530)) {
      console.warn('[Gelato] staging failed; retrying prod')
      res = await tryPost(BASE_PROD)
    }

    if (!res.ok) {
      const err = res.json as GelatoError | { raw?: string }
      console.error('[Gelato] order error', res.status, err)
      return NextResponse.json(
        { error: ('message' in err && err.message) || 'Gelato order failed', raw: res.json },
        { status: res.status },
      )
    }

    return NextResponse.json({ ok: true, gelato: res.json })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Gelato] place-order exception', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
