import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Portable : l'image Docker standalone ne dépend ni de Netlify ni de Vercel.
  output: "standalone",
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
