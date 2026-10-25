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
  async headers() {
    // Les routes privées et les liens signés ne doivent jamais être indexés
    // ni archivés par un moteur de recherche.
    const privees = [
      "/hote",
      "/hote/:path*",
      "/login",
      "/two-factor",
      "/presta",
      "/presta/:path*",
      "/proprio",
      "/proprio/:path*",
      "/commercial",
      "/commercial/:path*",
      "/support",
      "/support/:path*",
      "/facture/:path*",
      "/voyageur",
      "/voyageur/:path*",
      "/api/:path*",
    ];

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
          },
        ],
      },
      ...privees.map((source) => ({
        source,
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow, noarchive",
          },
        ],
      })),
    ];
  },
};

export default nextConfig;
