import { connection } from "next/server";

export async function GET() {
  // Opt out du prerender : un health check doit toujours être exécuté.
  await connection();

  return Response.json({
    ok: true,
    service: "lcd-v2",
    version: "0.1.0",
    date: new Date().toISOString(),
  });
}
