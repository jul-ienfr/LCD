/**
 * Exposition Prometheus (spec 006, FR-019).
 *
 * Les compteurs d'exploitation sont dérivés de la base à chaque scrape
 * (`metriques-exploitation.ts`) : ils survivent au redémarrage et restent
 * justes. Si la base est injoignable, les séries de compteurs sont omises et
 * `lcd_compteurs_collectes` vaut 0 — la panne reste visible côté Prometheus
 * sans casser l'endpoint (il sert aussi de sonde de vie).
 *
 * Scrape configuré : `monitoring/prometheus.yml` (service compose sous le
 * profil `monitoring`, jeton lu par `credentials_file`).
 */

import { sql } from "drizzle-orm";
import { env } from "@/lib/env";
import { db } from "@/infrastructure/db/client";
import {
  lignesPrometheus,
  lireCompteursExploitation,
} from "@/lib/server/metriques-exploitation";
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
  ];

  // Compteurs dérivés de la base : best-effort, jamais bloquants.
  let collectes = 0;
  try {
    lignes.push(...lignesPrometheus(await lireCompteursExploitation()));
    collectes = 1;
  } catch {
    collectes = 0;
  }
  lignes.push(
    "# HELP lcd_compteurs_collectes Les compteurs dérivés de la base ont été lus.",
    "# TYPE lcd_compteurs_collectes gauge",
    `lcd_compteurs_collectes ${collectes}`,
    "",
  );

  return new Response(lignes.join("\n"), {
    headers: {
      "content-type": "text/plain; version=0.0.4; charset=utf-8",
      "cache-control": "no-store",
    },
  });
};
