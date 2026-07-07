import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/privacy",
        destination: "/docs#privacy",
        permanent: true,
      },
      {
        source: "/terms",
        destination: "/docs#terms",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
