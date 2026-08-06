import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/myschedule",
        destination: "/myschedule.html",
      },
    ];
  },
};

export default nextConfig;
