import { connection } from "next/server";
import { genererFacturXXml } from "@/domain/factur-x";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { getSession, tenantIdDeSession } from "@/lib/session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();

  const session = await getSession();
  if (!session || session.user.actif === false) {
    return new Response("Non autorisé", { status: 401 });
  }
  if (!["admin", "hote", "comptable"].includes(session.user.role ?? "")) {
    return new Response("Accès refusé", { status: 403 });
  }

  const tenantId = tenantIdDeSession(session);
  const { id } = await params;

  const facture = await new DrizzleFactureRepository().trouver(tenantId, id);
  if (!facture) {
    return new Response("Facture introuvable", { status: 404 });
  }

  const [logement, tenant, fiscal] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(
      tenantId,
      facture.logementId,
    ),
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
  });

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Content-Disposition": `attachment; filename="${facture.numero}.xml"`,
      "Cache-Control": "private, no-store",
    },
  });
}
