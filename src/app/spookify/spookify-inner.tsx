'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SpookifyInner() {
  const params = useSearchParams()
  const router = useRouter()
  const id = params.get('id')

  const [original, setOriginal] = useState<string | null>(null)
  const [spookified, setSpookified] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSpooky, setShowSpooky] = useState(true)

  useEffect(() => {
    ;(async () => {
      if (!id) { router.push('/upload'); return }
      try {
        setLoading(true)
        setError(null)

        // fetch original
        const origRes = await fetch(`/api/get-image?id=${encodeURIComponent(id)}`)
        const origJson = (await origRes.json()) as { dataUrl?: string; error?: string }
        if (!origRes.ok || !origJson?.dataUrl) throw new Error(origJson.error || 'Original not found')
        setOriginal(origJson.dataUrl)

        // run spookify using stored plan/prompt
        const res = await fetch('/api/spookify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        })
        const data = (await res.json()) as {
          previewDataUrl?: string
          spookyImage?: string
          error?: string
          demo?: boolean
        }

        if (res.ok && (data.previewDataUrl || data.spookyImage)) {
          setSpookified(data.previewDataUrl ?? data.spookyImage ?? null)
        } else if (res.status === 503 && data.demo) {
          // graceful fallback
          setSpookified(origJson.dataUrl)
        } else {
          throw new Error(data.error || 'Failed to spookify')
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    })()
  }, [id, router])

  return (
    <main className="min-h-screen bg-black text-white py-16 px-4">
      <h1 className="text-4xl font-bold text-center mb-6">Your Spookified Art</h1>

      {loading && <p className="text-center mt-10">Summoning ghosts... 👻</p>}
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
        </div>
      )}
    </main>
  )
}
