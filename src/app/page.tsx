'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white px-4 md:px-12 py-10 space-y-20">

      {/* Hero Section */}
      <section className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-extrabold leading-tight">
          🎃 This Halloween, Replace Your Wall Art with a Haunted Version of Itself
        </h1>
        <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto">
          Transform your actual home decor into spooky masterpieces. Upload any artwork or photo — we’ll send you a haunted version, printed and delivered.
        </p>
        <div className="flex justify-center gap-4 mt-6 flex-wrap">
          <Link href="/upload" className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-full text-lg font-semibold">
            🧙‍♀️ Get Started – Upload Your Art
          </Link>
          <Link href="#examples" className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-full text-lg font-semibold">
            👻 See Examples
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto space-y-12">
        <h2 className="text-3xl font-bold text-center">🖼️ How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8 text-center">
          <div className="space-y-2">
            <div className="text-5xl">📸</div>
            <h3 className="font-semibold text-xl">Upload Your Art</h3>
            <p className="text-gray-400">Snap a photo of your wall art or family photo and upload it in seconds.</p>
          </div>
          <div className="space-y-2">
            <div className="text-5xl">🧠</div>
            <h3 className="font-semibold text-xl">Describe the Vibe</h3>
            <p className="text-gray-400">Tell us the spookiness level and the mood: gothic, cute, haunted, foggy, etc.</p>
          </div>
          <div className="space-y-2">
            <div className="text-5xl">🖨️</div>
            <h3 className="font-semibold text-xl">Receive a Haunted Print</h3>
            <p className="text-gray-400">We’ll send your haunted version as a premium print, ready to hang.</p>
          </div>
        </div>
      </section>

      {/* Why Spookify */}
      <section className="bg-gray-900 py-12 px-6 rounded-xl max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-6">🧛‍♀️ Why Spookify?</h2>
        <ul className="grid md:grid-cols-2 gap-4 text-lg text-gray-300 list-disc list-inside">
          <li>Transforms Your Actual Home Decor</li>
          <li>AI-Generated Just for You</li>
          <li>Printed on Premium Paper</li>
          <li>Makes a Great Gift or Party Feature</li>
          <li>Free Digital Preview Included</li>
          <li>Global Shipping Available</li>
        </ul>
      </section>

      {/* Product Info */}
      <section className="text-center space-y-4">
        <h2 className="text-3xl font-bold">📦 Product Options</h2>
        <p className="text-gray-300">Posters in A4, A3, A2, 50×70 cm</p>
        <p className="text-gray-300">From £14.99 — UK, EU, US, Canada, Australia</p>
        <p className="text-green-400 font-semibold">🎁 Free spooky preview before you commit to printing</p>
      </section>

      {/* Deadline Banner */}
      <section className="bg-orange-700 text-black text-center py-6 rounded-xl max-w-4xl mx-auto">
        <p className="text-xl font-bold">👻 Order by <strong>October 25</strong> to get your haunted print in time for Halloween!</p>
      </section>

    </main>
  )
}
