import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@ccwrapped/core'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

export default nextConfig;
