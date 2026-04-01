import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Allow large multipart bodies for server actions (used by file uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb', // default is 1mb
    },
  },
};

export default nextConfig;
