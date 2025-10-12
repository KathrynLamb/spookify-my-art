import { Suspense } from 'react'
import ThankYouClient from './ThankYouClient'

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div className="p-8 text-white">Loading…</div>}>
      <ThankYouClient />
    </Suspense>
  )
}
