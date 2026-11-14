/**
 * T511 — Téléchargement d'un relevé archivé au format PDF.
 *
 * Accès : le propriétaire ne peut télécharger que ses propres relevés ;
 * admin/hote peuvent télécharger n'importe quel relevé du tenant.
 *
 * Chaque téléchargement est tracé dans `envois_releves` (canal `portail`,
 * statut `telecharge`) de façon idempotente par `envoiRef` :
 * `portail:{tenantId}:{releveId}`.
 */
import { versOptionsPdfReleve } from "@/infrastructure/adapters/pdf-releve-mapping";
import { genererReleveProprietairePdf } from "@/infrastructure/adapters/pdf-releve-proprietaire";
import {
  DrizzleEnvoisRelevesRepository,
  DrizzleRelevesProprietairesRepository,
} from "@/infrastructure/db/repositories/releves-repository";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async (event) => {
  const session = requireRole(event, ["proprietaire", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const estProprietaire = session.user.role === "proprietaire";

  const releve = await new DrizzleRelevesProprietairesRepository().trouverParId(
    tenantId,
    event.params.id,
  );
  if (!releve) {
    return new Response("Relevé introuvable", { status: 404 });
  }
  if (estProprietaire && releve.proprietaireId !== session.user.id) {
    return new Response("Accès refusé", { status: 403 });
  }

  // Trace du téléchargement portail (idempotent par envoiRef).
  const envois = new DrizzleEnvoisRelevesRepository();
  const envoiRef = `portail:${tenantId}:${releve.id}`;
  const existant = await envois.trouverParRef(tenantId, envoiRef);
  if (existant) {
    await envois.mettreAJourStatut(tenantId, existant.id, "telecharge");
  } else {
    await envois.enregistrer(tenantId, {
      tenantId,
      releveId: releve.id,
      proprietaireId: releve.proprietaireId,
      canal: "portail",
      destinataire: session.user.email ?? releve.proprietaireNom,
      envoiRef,
      envoyeAt: new Date().toISOString(),
      statut: "telecharge",
      erreur: null,
    });
  }

  const pdf = await genererReleveProprietairePdf(versOptionsPdfReleve(releve));
  return new Response(Buffer.from(pdf), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="releve-${releve.moisDebut}-${releve.periode}.pdf"`,
      "cache-control": "private, no-store",
    },
  });
};
