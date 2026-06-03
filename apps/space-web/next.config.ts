import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "*.ngrok-free.app",
    "*.ngrok.app",
    "*.ngrok.io",
  ],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
    ],
  },
};

export default nextConfig;
