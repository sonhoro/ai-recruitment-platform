import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Enable React strict mode for better development warnings
  reactStrictMode: true,

  images: {
    // Allow Supabase Storage public URLs for candidate avatars / assets
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Silence the "Critical dependency" warnings from Supabase SSR internals
  webpack: (config) => {
    config.externals = [...(config.externals ?? []), 'pg-native'];
    return config;
  },
};

export default nextConfig;
