import { sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { db } from "@/infrastructure/db/client";
import type { RequestHandler } from "./$types";

const debut = Date.now();

export const GET: RequestHandler = async ({ request }) => {
  if (env.METRICS_TOKEN) {
    const attendu = `Bearer ${env.METRICS_TOKEN}`;
    if (request.headers.get("authorization") !== attendu) {
      return new Response("Non autorisé.", { status: 401 });
    }
  }

  const t0 = performance.now();
  let pret = 0;
  try {
    await db.execute(sql`select 1`);
    pret = 1;
  } catch {
    pret = 0;
  }
  const latence = Math.round(performance.now() - t0);
  const lignes = [
    "# HELP lcd_up Processus applicatif joignable.",
    "# TYPE lcd_up gauge",
    "lcd_up 1",
    "# HELP lcd_ready Base de données joignable.",
    "# TYPE lcd_ready gauge",
    `lcd_ready ${pret}`,
    "# HELP lcd_uptime_seconds Durée depuis le démarrage du processus.",
    "# TYPE lcd_uptime_seconds counter",
    `lcd_uptime_seconds ${Math.round((Date.now() - debut) / 1000)}`,
    "# HELP lcd_db_latency_ms Latence du ping base de données.",
    "# TYPE lcd_db_latency_ms gauge",
    `lcd_db_latency_ms ${latence}`,
    "",
  ];

  return new Response(lignes.join("\n"), {
    headers: {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};
