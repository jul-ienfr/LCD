import type { NextConfig } from "next";

// Netlify utilise son plugin Next et n'aime pas `output: "standalone"`.
// Docker/VPS utilisent standalone. Le même code reste portable.
const surNetlify = process.env.NETLIFY === "true" || process.env.NETLIFY === "1";

const nextConfig: NextConfig = {
  /* config options here */
  output: surNetlify ? undefined : "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
