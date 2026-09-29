import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  async redirects() {
    return [
      // Section 31 PHV(L)A 1998: the old "taxi-services" slug is retired.
      // Explicit statusCode 301 (not `permanent`, which emits 308) so search
      // engines permanently transfer ranking to the compliant URL.
      {
        source: "/taxi-services",
        destination: "/private-hire-services",
        statusCode: 301,
      },
      {
        source: "/minicab-services",
        destination: "/private-hire-services",
        statusCode: 301,
      },
    ];
  },
};

export default nextConfig;
