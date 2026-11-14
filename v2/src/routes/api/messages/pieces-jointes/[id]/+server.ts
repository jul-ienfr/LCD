import { error } from "@sveltejs/kit";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFilsVoyageurRepository } from "@/infrastructure/db/repositories/fils-voyageur-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import { stockageFichiers } from "@/lib/server/stockage";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  const session = requireRole(event, ["admin", "hote", "operateur"]);
  const tenantId = tenantIdDeSession(session);
  const depot = new DrizzleFilsVoyageurRepository();
  const piece = await depot.trouverPieceJointe(tenantId, event.params.id);
  if (!piece) throw error(404, "Pièce jointe introuvable.");

  let octets: Uint8Array;
  try {
    octets = await stockageFichiers().get(piece.cleStockage);
  } catch (erreur) {
    logErreur("piece-jointe.get", erreur, { pieceId: piece.id });
    throw error(404, "Fichier indisponible.");
  }

  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: session.user?.email ?? "inconnu",
      action: "piece-jointe.lire",
      cible: piece.id,
      payload: { nomFichier: piece.nomFichier },
    }),
  );

  return new Response(new Uint8Array(octets), {
    headers: {
      "content-type": piece.typeMime,
      "content-length": String(octets.byteLength),
      "content-disposition": `attachment; filename="${piece.nomFichier.replace(/["\\]/g, "-")}"`,
      "cache-control": "private, no-store",
    },
  });
};
