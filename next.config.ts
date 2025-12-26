import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Убрано output: "standalone" - это для Docker, не для Vercel
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
