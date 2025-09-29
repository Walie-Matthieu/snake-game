import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  // No custom webpack rules here to avoid the "Webpack is configured while Turbopack is not" warning.
};

export default nextConfig;
