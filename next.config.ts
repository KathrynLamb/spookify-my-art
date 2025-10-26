import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.blob.vercel-storage.com' },
      { protocol: 'https', hostname: 'fpabsqys5cky7azh.public.blob.vercel-storage.com' },
    ],
  },
  experimental: {
    // Keep native module out of the server bundle; resolve from node_modules at runtime.
    serverComponentsExternalPackages: ['sharp'],
  },
};

export default nextConfig;
