import { connection } from "next/server";
import { genererFacturXXml } from "@/domain/factur-x";
import { resteAPayer, totalPaiements } from "@/domain/paiement";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { genererPdfFacture } from "@/infrastructure/adapters/pdf-facture";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { verifierTokenFacture } from "@/lib/facture-token";
import { getSession, tenantIdDeSession } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await connection();

  const { id } = await params;
  const url = new URL(request.url);
  const token = url.searchParams.get("t");

  let tenantId: string | null = null;
  if (token) {
    const payload = verifierTokenFacture(token);
    if (!payload || payload.factureId !== id) {
      return new Response("Lien invalide ou expiré", { status: 401 });
    }
    tenantId = payload.tenantId;
  } else {
    const session = await getSession();
    if (!session) return new Response("Non autorisé", { status: 401 });
    if (!["admin", "hote", "comptable"].includes(session.user.role ?? "")) {
      return new Response("Accès refusé", { status: 403 });
    }
    tenantId = tenantIdDeSession(session);
  }

  const facture = await new DrizzleFactureRepository().trouver(tenantId, id);
  if (!facture) {
    return new Response("Facture introuvable", { status: 404 });
  }

  const [logement, tenant, fiscal, paiements] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(
      tenantId,
      facture.logementId,
    ),
    new DrizzleTenantRepository().trouver(tenantId),
    new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(tenantId),
    new DrizzlePaiementRepository().listerParFacture(tenantId, id),
  ]);

  const xml = genererFacturXXml(facture, {
    vendeurNom: tenant?.nom ?? "LCD Parc",
    vendeurAdresse: logement?.adresse ?? null,
    tauxTvaBp: fiscal.tauxTvaBp,
    mentionsLegales: fiscal.mentionsLegales,
  });

  const montantPaye = totalPaiements(paiements);
  const pdf = await genererPdfFacture(facture, {
    vendeurNom: tenant?.nom ?? "LCD Parc",
    vendeurAdresse: logement?.adresse ?? null,
    logementNom: logement?.nom ?? null,
    xmlFacturX: xml,
    montantPayeCentimes: montantPaye,
    resteCentimes:
      facture.statut === "payee"
        ? 0
        : resteAPayer(facture.montantTtcCentimes, paiements),
    mentionsLegales: fiscal.mentionsLegales,
  });

  const corps = new Blob([pdf as unknown as BlobPart], {
    type: "application/pdf",
  });

  return new Response(corps, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${facture.numero}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
