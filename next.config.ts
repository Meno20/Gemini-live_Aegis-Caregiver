import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Allow cross-origin requests from preview environment
  allowedDevOrigins: [
    "preview-chat-8f0aec20-54bb-49a1-b20f-20dfb9341f61.space.z.ai",
    ".space.z.ai",
    "localhost",
  ],
};

export default nextConfig;
