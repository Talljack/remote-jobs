import createNextIntlPlugin from "next-intl/plugin";

import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
};

export default withNextIntl(nextConfig);
