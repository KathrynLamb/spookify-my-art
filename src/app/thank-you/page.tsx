// src/app/thank-you/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

export default function ThankYou() {
  // Build the referral ONLY on client to avoid SSR/CSR mismatch
  const [referral, setReferral] = useState<string>('') // empty on SSR
  useEffect(() => {
    const refCode = 'boo' // or generate per-session
    const origin = window.location.origin // localhost in dev, your domain in prod
    setReferral(`${origin}/?ref=${encodeURIComponent(refCode)}`)
  }, [])

  const canShare = typeof navigator !== 'undefined' && !!navigator.share
  // const canClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard

  const shareTitle = 'Check out my spooky art 🎃'

  async function copyReferral() {
    try {
      if (!referral) return
      await navigator.clipboard.writeText(referral)
      alert('Link copied!')
    } catch {
      // fallback
      prompt('Copy this link:', referral)
    }
  }

  async function webShare() {
    try {
      if (!referral || !canShare) return
      await navigator.share({ title: shareTitle, text: 'Made with Spookify!', url: referral })
    } catch {
      // user cancelled or not supported
    }
  }

  // Helpful: don’t render the title attribute until mounted
  const buttonTitle = useMemo(() => (referral ? referral : undefined), [referral])

  return (
    <main className="min-h-screen bg-black text-white px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Thank you!</h1>

      <div className="space-y-3">
        <div className="text-white/80">Share your spooky art</div>

        <div className="flex gap-3">
          <button
            onClick={copyReferral}
            title={buttonTitle}
            className="px-4 py-2 rounded-full bg-purple-700 hover:bg-purple-600 transition"
            disabled={!referral}
          >
            Copy share link
          </button>

          <button
            onClick={webShare}
            title={buttonTitle}
            className="px-4 py-2 rounded-full bg-purple-700 hover:bg-purple-600 transition disabled:opacity-50"
            disabled={!referral || !canShare}
          >
            Share via…
          </button>
        </div>

        {/* Optional: show the link once mounted */}
        <p className="text-sm text-white/60 break-all mt-2">
          {referral ? referral : 'Generating your link…'}
        </p>
      </div>
    </main>
  )
}
