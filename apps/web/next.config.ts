import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@kashmir/db", "@kashmir/types", "@kashmir/ui"],
  experimental: {
    typedRoutes: true
  }
};

export default nextConfig;
