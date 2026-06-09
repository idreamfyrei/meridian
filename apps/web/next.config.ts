import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@meridian/config",
    "@meridian/logger",
    "@meridian/db",
    "@meridian/corsair",
  ],
};

export default nextConfig;
