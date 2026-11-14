import { documentOpenApi } from "@/lib/server/api-openapi";
import type { RequestHandler } from "./$types";

/** T706 — Document OpenAPI public (aucune donnée tenant). */
export const GET: RequestHandler = ({ url }) => {
  return new Response(JSON.stringify(documentOpenApi(url.origin)), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};
