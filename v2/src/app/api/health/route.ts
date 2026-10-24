import { connection } from "next/server";
import { APP_VERSION } from "@/lib/version";

export async function GET() {
  // Liveness : ne dépend pas de la DB (le readiness la vérifie).
  await connection();

  return Response.json({
    ok: true,
    service: "lcd-v2",
    version: APP_VERSION,
    uptimeSecondes: Math.round(process.uptime()),
    date: new Date().toISOString(),
  });
}
