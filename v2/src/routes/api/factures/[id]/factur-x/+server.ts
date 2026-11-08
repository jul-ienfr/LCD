import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { genererFacturXXml } from "@/domain/factur-x";
import { mediateurDepuisEnv, mentionMediation } from "@/domain/mediation";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { env } from "@/lib/env";
import { tenantIdDeSession, verifierAccesApi } from "@/lib/server/session";
import type { RequestHandler } from "./$types";

const ROLES = ["admin", "hote", "comptable"];

export const GET: RequestHandler = async ({ params, locals }) => {
  const session = locals.session;
  const refus = verifierAccesApi(session, ROLES);
  if (refus) return refus;

  const tenantId = tenantIdDeSession(session!);
  const facture = await new DrizzleFactureRepository().trouver(
    tenantId,
    params.id,
  );
  if (!facture) return new Response("Facture introuvable", { status: 404 });

  const [logement, tenant, fiscal] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(tenantId, facture.logementId),
    new DrizzleTenantRepository().trouver(tenantId),
    new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(tenantId),
  ]);

  const xml = genererFacturXXml(facture, {
    vendeurNom: tenant?.nom ?? "LCD Parc",
    vendeurAdresse: tenant?.adresse ?? logement?.adresse ?? null,
    vendeurSiren: tenant?.siren ?? null,
    tauxTvaBp: fiscal.tauxTvaBp,
    mentionsLegales: fiscal.mentionsLegales ?? tenant?.mentionsLegales ?? null,
    mediation: mentionMediation(
      mediateurDepuisEnv({
        nom: env.MEDIATEUR_NOM,
        url: env.MEDIATEUR_URL,
        adresse: env.MEDIATEUR_ADRESSE,
      }),
    ),
  });

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "content-disposition": `attachment; filename="${facture.numero}.xml"`,
      "cache-control": "private, no-store",
    },
  });
};
