'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SpookifyPage() {
  const params = useSearchParams()
  const router = useRouter()
  const id = params.get('id') // this is your imageId

  const [original, setOriginal] = useState<string | null>(null)
  const [spookified, setSpookified] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [slow, setSlow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showSpooky, setShowSpooky] = useState(true)
  const [printing, setPrinting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSlow(true), 6000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    (async () => {
      if (!id) { router.push('/upload'); return }
      try {
        setLoading(true)
        setError(null)

        // 1) Get the original (data URL) from your temp store
        const origRes = await fetch(`/api/get-image?id=${encodeURIComponent(id)}`)
        const origJson = await origRes.json()
        if (!origRes.ok || !origJson?.dataUrl) throw new Error('Original not found')
        const dataUrl: string = origJson.dataUrl
        setOriginal(dataUrl)

        // 2) Ask server to spookify based on the stored prompt for this id
        //    (Your /api/spookify route reads { id } and uses the saved finalizedPrompt)
        const res = await fetch('/api/spookify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id })
        })
        const data = await res.json()

        if (res.ok && (data.previewDataUrl || data.spookyImage)) {
          setSpookified(data.previewDataUrl ?? data.spookyImage)
        } else if (res.status === 503 && data.demo) {
          // graceful demo fallback = just show the original
          setSpookified(dataUrl)
        } else {
          throw new Error(data.error || 'Failed to spookify')
        }
      } catch (e: any) {
        setError(e.message || 'Something went wrong')
      } finally {
        setLoading(false)
      }
    })()
  }, [id, router])

  // Print flow: upload the spookified image to blob storage, then create Stripe Checkout
  const handlePrint = async () => {
    try {
      if (!spookified || !id) {
        setError('Generate your spookified image first.')
        return
      }
      setPrinting(true)
      setError(null)

      // 1) Upload the spookified data URL to get a public file URL (for Gelato)
      const upRes = await fetch('/api/upload-spooky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataUrl: spookified })
      })
      const upJson = await upRes.json()
      if (!upRes.ok || !upJson?.url) throw new Error(upJson.error || 'Upload failed')
      const fileUrl: string = upJson.url

      // 2) Create Stripe Checkout session
      const chkRes = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl,
          imageId: id,
          size: '50x70',     // TODO: wire a size selector if you want
          price: 2999        // $29.99 (or use GBP in your /api/checkout)
        })
      })
      const chkJson = await chkRes.json()
      if (!chkRes.ok || !chkJson?.url) throw new Error(chkJson.error || 'Checkout failed')

      // 3) Redirect to Stripe
      window.location.href = chkJson.url
    } catch (e: any) {
      setError(e.message || 'Print failed')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <main className="min-h-screen bg-black text-white py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-6">Your Spookified Art</h1>

      {loading && <p className="text-center mt-10">Summoning ghosts... 👻</p>}
      {slow && loading && !error && (
        <p className="text-center mt-2 text-sm text-gray-400">
          Large images can take 20–60s on the first run.
        </p>
      )}
      {error && <p className="text-red-400 text-center mt-6">{error}</p>}

      {spookified && (
        <div className="flex flex-col items-center gap-6 mt-10">
          <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] border-4 border-white rounded overflow-hidden bg-black">
            {original && (
              <Image
                src={original}
                alt="Original Art"
                fill
                className={`object-contain absolute top-0 left-0 transition-opacity duration-500 ${
                  showSpooky ? 'opacity-0' : 'opacity-100'
                }`}
                priority
              />
            )}
            <Image
              src={spookified}
              alt="Spookified Art"
              fill
              className={`object-contain absolute top-0 left-0 transition-opacity duration-500 ${
                showSpooky ? 'opacity-100' : 'opacity-0'
              }`}
              priority
            />
          </div>

          <button
            onClick={() => setShowSpooky(!showSpooky)}
            className="bg-purple-700 hover:bg-purple-600 px-5 py-2 rounded-full"
          >
            {showSpooky ? 'Show Original' : 'Show Spookified'}
          </button>

          <div className="flex gap-4 mt-2">
            <a
              href={spookified}
              download="spookified-art.png"
              className="bg-white text-black px-4 py-2 rounded"
            >
              Download
            </a>
            <button
              onClick={handlePrint}
              disabled={printing}
              className="bg-orange-600 hover:bg-orange-500 px-4 py-2 rounded disabled:opacity-60"
            >
              {printing ? 'Sending to Checkout…' : 'Print as Poster'}
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
