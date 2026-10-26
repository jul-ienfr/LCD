import { connection } from "next/server";
import {
  joursDuMois,
  moisCourant,
  moisValide,
} from "@/domain/calendrier";
import { genererFacturXXml } from "@/domain/factur-x";
import { creerZip } from "@/domain/zip";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { getSession, tenantIdDeSession } from "@/lib/session";

function nomFichierSur(numero: string, id: string): string {
  const base = numero.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return `${base || id}.xml`;
}

export async function GET(request: Request) {
  await connection();

  const session = await getSession();
  if (!session || session.user.actif === false) {
    return new Response("Non autorisé", { status: 401 });
  }
  if (!["admin", "hote", "comptable"].includes(session.user.role ?? "")) {
    return new Response("Accès refusé", { status: 403 });
  }

  const url = new URL(request.url);
  const moisParam = url.searchParams.get("mois");
  const mois =
    moisParam && moisValide(moisParam) ? moisParam : moisCourant();
  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) {
    return new Response("Mois invalide", { status: 400 });
  }

  const tenantId = tenantIdDeSession(session);
  const factures = await new DrizzleFactureRepository().listerParMois(
    tenantId,
    premier,
    dernier,
  );
  const emises = factures.filter(
    (facture) => facture.statut === "emise" || facture.statut === "payee",
  );
  if (emises.length === 0) {
    return new Response("Aucune facture émise pour ce mois.", { status: 404 });
  }

  const [tenant, fiscal, logements] = await Promise.all([
    new DrizzleTenantRepository().trouver(tenantId),
    new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(tenantId),
    new DrizzleLogementRepository().listerParTenant(tenantId),
  ]);
  const adresseLogement = new Map(
    logements.map((logement) => [logement.id, logement.adresse]),
  );

  const fichiers = emises.map((facture) => ({
    nom: nomFichierSur(facture.numero, facture.id),
    contenu: genererFacturXXml(facture, {
      vendeurNom: tenant?.nom ?? "LCD Parc",
      vendeurAdresse:
        tenant?.adresse ?? adresseLogement.get(facture.logementId) ?? null,
      vendeurSiren: tenant?.siren ?? null,
      tauxTvaBp: fiscal.tauxTvaBp,
      mentionsLegales:
        fiscal.mentionsLegales ?? tenant?.mentionsLegales ?? null,
    }),
  }));
  const archive = creerZip(fichiers);
  const corps = new ArrayBuffer(archive.byteLength);
  new Uint8Array(corps).set(archive);

  return new Response(corps, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="factur-x-${mois}.zip"`,
      "Cache-Control": "private, no-store",
      "X-Factures": String(emises.length),
    },
  });
}
