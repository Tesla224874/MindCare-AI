import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@mindcare/analysis", "@mindcare/shared"],
};

export default nextConfig;
