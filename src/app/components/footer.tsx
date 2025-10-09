'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-white/10 mt-12 py-8 px-4 md:px-8">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
        <div className="text-center md:text-left">
          <p className="font-bold text-lg">Spookify My Art 👻</p>
          <p className="text-gray-400">© {new Date().getFullYear()} Kathryn Lamb · All rights reserved</p>
        </div>

        <div className="flex gap-4 flex-wrap justify-center md:justify-end">
          <Link href="/terms" className="hover:underline text-gray-300">Terms</Link>
          <Link href="/privacy" className="hover:underline text-gray-300">Privacy</Link>
          <Link href="/refunds" className="hover:underline text-gray-300">Refunds</Link>
          <Link href="/shipping" className="hover:underline text-gray-300">Shipping</Link>
          <a href="mailto:katylamb@gmail.com" className="hover:underline text-gray-300">Support</a>
        </div>
      </div>
    </footer>
  )
}
