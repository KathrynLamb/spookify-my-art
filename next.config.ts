import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // ⬅️ Top-level in Next 15
  serverExternalPackages: ['sharp'],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'fpabsqys5cky7azh.public.blob.vercel-storage.com' },
    ],
  },
};

export default nextConfig;
