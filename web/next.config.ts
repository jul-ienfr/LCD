import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // Self-hosted Docker : `output: "standalone"` = image minimale sans
  // node_modules (guide embarqué : docs/01-app/02-guides/self-hosting.md).
  // LCD_GATEWAY_URL reste lu au runtime (SSR/Server Actions, jamais exposé).
  output: "standalone",
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
