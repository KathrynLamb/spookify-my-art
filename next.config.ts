// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],

  webpack: (config) => {
    config.experiments = { ...(config.experiments ?? {}), asyncWebAssembly: true };
    return config;
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.blob.vercel-storage.com" },
      { protocol: "https", hostname: "fpabsqys5cky7azh.public.blob.vercel-storage.com" },
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
