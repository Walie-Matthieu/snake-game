import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/snake-game",
  assetPrefix: "/snake-game/",
  reactStrictMode: false,
  // No custom webpack rules here to avoid the "Webpack is configured while Turbopack is not" warning.
};

export default nextConfig;

// This file is intentionally left blank to allow for custom scripts to be added.
// The custom scripts are defined in the package.json file.
