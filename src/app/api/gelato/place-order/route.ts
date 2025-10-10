// src/app/api/gelato/place-order/route.ts
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BASE = 'https://order.gelatoapis.com/v3' // use prod; staging often 530s behind CF

type ShippingAddress = {
  firstName?: string
  lastName?: string
  name?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  postCode?: string
  state?: string
  country: string
  email?: string
  phone?: string
}

type Body = {
  productUid?: string
  sku?: string
  fileUrl?: string
  imageId?: string
  currency?: string
  // prefer shippingAddress, but accept legacy "address"
  shippingAddress?: ShippingAddress
  address?: {
    name?: string
    address1?: string
    address2?: string | null
    city?: string
    postalCode?: string
    country: string
    state?: string | null
    phone?: string | null
    email?: string | null
  }
  shipmentMethodUid?: string
  attributes?: Record<string, string | number | boolean | null | undefined>
  externalOrderId?: string
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function coerceAddress(body: Body): ShippingAddress | undefined {
  if (body.shippingAddress) return body.shippingAddress
  if (body.address) {
    const a = body.address
    return {
      name: a.name,
      addressLine1: a.address1,
      addressLine2: a.address2 ?? undefined,
      city: a.city,
      postCode: a.postalCode,
      state: a.state ?? undefined,
      country: a.country,
      phone: a.phone ?? undefined,
      email: a.email ?? undefined,
    }
  }
  return undefined
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GELATO_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing GELATO_API_KEY' }, { status: 500 })
    }

    const body = (await req.json()) as Body

    const productUid = body.productUid || body.sku
    if (!productUid) return NextResponse.json({ error: 'Missing productUid' }, { status: 400 })
    if (!body.fileUrl) return NextResponse.json({ error: 'Missing fileUrl' }, { status: 400 })

    const shipTo = coerceAddress(body)
    if (!shipTo?.country) {
      return NextResponse.json({ error: 'Missing shippingAddress.country' }, { status: 400 })
    }
    if (!shipTo.addressLine1) {
      return NextResponse.json({ error: 'Missing shippingAddress.addressLine1' }, { status: 400 })
    }
    if (!shipTo.city) {
      return NextResponse.json({ error: 'Missing shippingAddress.city' }, { status: 400 })
    }
    if (!shipTo.postCode) {
      return NextResponse.json({ error: 'Missing shippingAddress.postCode' }, { status: 400 })
    }
    if (!shipTo.email) {
      return NextResponse.json({ error: 'Missing shippingAddress.email' }, { status: 400 })
    }

    const payload = {
      // These keys/values match Gelato’s API
      orderReferenceId: body.externalOrderId ?? `spookify_${Date.now()}`,
      orderType: 'order', // required (not 'SalesOrder')
      currency: (body.currency || 'GBP').toUpperCase(),
      channel: 'api',

      shippingAddress: {
        firstName: shipTo.firstName,
        lastName: shipTo.lastName,
        name: shipTo.name,
        addressLine1: shipTo.addressLine1,
        addressLine2: shipTo.addressLine2,
        city: shipTo.city,
        postCode: shipTo.postCode,
        state: shipTo.state,
        country: shipTo.country,
        email: shipTo.email,
        phone: shipTo.phone,
      },

      items: [
        {
          itemReferenceId: 'line-1',
          productUid,
          quantity: 1,
          fileUrl: body.fileUrl,
          attributes: body.attributes ?? undefined,
        },
      ],

      shipments: [
        {
          shipmentReferenceId: 'ship-1',
          shipmentMethodUid: body.shipmentMethodUid || 'STANDARD',
          items: [{ itemReferenceId: 'line-1' }],
        },
      ],
    }

    console.log('[Gelato] payload', JSON.stringify(payload, null, 2))

    // Robust retry (for CF 530/5xx)
    const maxAttempts = 4
    let attempt = 0
    let lastStatus = 0
    let lastJson: unknown = null
    let lastText: string | null = null

    while (attempt < maxAttempts) {
      attempt += 1
      try {
        const url = `${BASE}/orders`
        console.log(`[Gelato] POST ${url} (attempt ${attempt}/${maxAttempts})`)
        const r = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': apiKey,
          },
          body: JSON.stringify(payload),
        })

        lastStatus = r.status

        const ct = r.headers.get('content-type') || ''
        if (ct.includes('application/json')) {
          const j = await r.json().catch(() => ({}))
          lastJson = j
          if (r.ok) {
            return NextResponse.json({ ok: true, gelato: j })
          } else {
            // 4xx -> don’t retry; 5xx -> retry
            if (r.status >= 500) {
              console.warn('[Gelato] 5xx JSON response; will retry', r.status, j)
            } else {
              console.error('[Gelato] order error', r.status, j)
              return NextResponse.json(
                { error: j?.message || 'Gelato order failed', raw: j },
                { status: r.status },
              )
            }
          }
        } else {
          // Not JSON (Cloudflare HTML etc.)
          const t = await r.text().catch(() => '')
          lastText = t
          if (r.ok) {
            // Unlikely, but just in case:
            return NextResponse.json({ ok: true, gelato: { raw: t } })
          }
          if (r.status >= 500) {
            console.warn('[Gelato] 5xx non-JSON; will retry', r.status)
          } else {
            console.error('[Gelato] non-JSON error', r.status)
            return NextResponse.json(
              { error: 'Gelato order failed (non-JSON)', raw: t?.slice(0, 5000) },
              { status: r.status },
            )
          }
        }
      } catch (e) {
        console.warn('[Gelato] fetch threw; will retry', (e as Error)?.message)
      }

      // backoff before next try
      const waitMs = 400 * Math.pow(2, attempt - 1) + Math.round(Math.random() * 200)
      await sleep(waitMs)
    }

    // If we’re here, all attempts failed
    const debug =
      lastJson ??
      (lastText ? { raw: lastText.slice(0, 5000) } : { error: 'No response body captured' })
    console.error('[Gelato] exhausted retries', lastStatus, debug)
    return NextResponse.json(
      {
        error:
          lastStatus === 530
            ? 'Gelato (Cloudflare) Origin DNS error — please retry.'
            : 'Gelato order failed after retries',
        raw: debug,
        status: lastStatus,
      },
      { status: 502 },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Gelato] place-order exception', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
