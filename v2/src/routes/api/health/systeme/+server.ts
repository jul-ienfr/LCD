import { json } from "@sveltejs/kit";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import {
  lireSanteBox,
  lireSanteDisque,
  lireSanteTls,
} from "@/lib/server/sante-systeme";
import type { RequestHandler } from "./$types";

function tokenValide(recu: string): boolean {
  const attendu = env.HEALTH_TOKEN;
  if (!attendu || recu.length !== attendu.length) return false;
  return timingSafeEqual(Buffer.from(recu), Buffer.from(attendu));
}

export const GET: RequestHandler = async ({ request }) => {
  if (!env.HEALTH_TOKEN) {
    return json(
      { ok: false, erreur: "Moniteur non configuré (HEALTH_TOKEN)." },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const porteur = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  const recu = request.headers.get("x-health-token") ?? porteur;
  if (!tokenValide(recu)) {
    return json(
      { ok: false, erreur: "Jeton invalide." },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  const [disque, tls, box] = await Promise.all([
    lireSanteDisque(),
    lireSanteTls(),
    lireSanteBox(),
  ]);
  const ok = disque.ok && tls.ok && (!box.configure || box.ok);
  return json(
    { ok, disque, tls, box },
    { status: ok ? 200 : 503, headers: { "cache-control": "no-store" } },
  );
};
