import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    // leave optimization ON (default)
    remotePatterns: [
      { protocol: 'https', hostname: '**.blob.vercel-storage.com' },
      // optional: keep the exact host if you prefer to be explicit
      { protocol: 'https', hostname: 'fpabsqys5cky7azh.public.blob.vercel-storage.com' },
    ],
  },
  experimental: {
    serverExternalPackages: ['sharp'], // keep native module external
  },
}

export default nextConfig
