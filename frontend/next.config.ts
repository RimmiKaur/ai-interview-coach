import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  outputFileTracingRoot: process.cwd(),
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
