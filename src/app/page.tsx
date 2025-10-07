'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

export default function HomePage() {
  const [showSpooky, setShowSpooky] = useState(false)

  return (
    <main className="min-h-screen bg-black text-white font-sans">
      {/* Hero */}
      <section className="py-20 text-center px-4">
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          Spookify Your Art 👻
        </h1>
        <p className="text-lg md:text-xl max-w-xl mx-auto mb-8">
          Upload any artwork, and we’ll haunt it with ghosts, fog, and creepy magic.
          Then print it as a poster, mug, or digital download.
        </p>
        <Link href="/upload">
          <button className="bg-white text-black px-6 py-3 rounded-full font-semibold hover:bg-orange-300 transition">
            Upload Your Art
          </button>
        </Link>
      </section>

      {/* Before/After Preview */}
      <section className="bg-gray-900 py-16 px-4">
        <h2 className="text-3xl font-bold text-center mb-10">See the Magic</h2>
        <div className="max-w-3xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8">
          <div className="relative w-[300px] h-[300px] border-4 border-white rounded overflow-hidden">
            <Image
              src="/demo-original.jpg"
              alt="Original art"
              fill
              className={`object-cover transition-opacity duration-500 ${showSpooky ? 'opacity-0' : 'opacity-100'}`}
            />
            <Image
              src="/demo-spooky.jpg"
              alt="Spookified art"
              fill
              className={`object-cover absolute top-0 left-0 transition-opacity duration-500 ${showSpooky ? 'opacity-100' : 'opacity-0'}`}
            />
          </div>
          <button
            onClick={() => setShowSpooky(!showSpooky)}
            className="text-white bg-purple-700 px-4 py-2 rounded hover:bg-purple-500 transition"
          >
            {showSpooky ? 'Show Original' : 'Show Spookified'}
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-black text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Why People Love It</h2>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <li className="bg-gray-800 p-6 rounded-lg shadow-md">
              🎨 AI-powered spooky effects added to your own art
            </li>
            <li className="bg-gray-800 p-6 rounded-lg shadow-md">
              🧾 Download or print as poster, mug, or canvas
            </li>
            <li className="bg-gray-800 p-6 rounded-lg shadow-md">
              🚀 No account required. Magic in seconds.
            </li>
          </ul>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-gray-400 bg-gray-950">
        Made with 👻 by SpookifyMyArt • © 2025
      </footer>
    </main>
  )
}
