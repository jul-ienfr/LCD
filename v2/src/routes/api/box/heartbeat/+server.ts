import { json } from "@sveltejs/kit";
import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import type { RequestHandler } from "./$types";

function tokenValide(recu: string): boolean {
  const attendu = env.BOX_TOKEN;
  if (!attendu || recu.length !== attendu.length) return false;
  return timingSafeEqual(Buffer.from(recu), Buffer.from(attendu));
}

export const POST: RequestHandler = async ({ request }) => {
  if (!env.BOX_TOKEN) {
    return json(
      { ok: false, erreur: "Heartbeat box non configuré (BOX_TOKEN)." },
      { status: 503 },
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const porteur = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  const recu = request.headers.get("x-box-token") ?? porteur;
  if (!tokenValide(recu)) {
    return json({ ok: false, erreur: "Jeton invalide." }, { status: 401 });
  }

  await new DrizzleParametresSiteRepository().ecrire(
    "box.dernier_contact",
    new Date().toISOString(),
  );
  return json({ ok: true });
};
