import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.8"],

  async rewrites() {
    return [
      {
        source: "/api/chat",
        destination:
          "https://mining-ai-assistent-el6l.vercel.app/api/chat",
      },
    ];
  },
};

export default nextConfig;