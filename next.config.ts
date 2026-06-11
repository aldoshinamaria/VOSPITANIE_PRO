import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack(config, { dev }) {
    if (dev) {
      // OneDrive can leave Next.js webpack pack files half-written between long-lived dev sessions.
      // Disabling the dev filesystem cache prevents intermittent 500 responses from corrupted packs.
      config.cache = false;
    }

    return config;
  }
};

export default nextConfig;
