/**
 * T511 — Écran `/proprio/releves` : liste des relevés archivés.
 *
 * Un propriétaire voit uniquement ses relevés ; les rôles staff
 * (admin/hote) voient tous les relevés du tenant. Chaque relevé est
 * téléchargeable en PDF via `/api/proprio/releves/[id]`.
 */
import { libellePeriodeReleve } from "@/infrastructure/adapters/pdf-releve-mapping";
import { DrizzleRelevesProprietairesRepository } from "@/infrastructure/db/repositories/releves-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["proprietaire", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const estProprietaire = session.user.role === "proprietaire";

  const repository = new DrizzleRelevesProprietairesRepository();
  const releves = estProprietaire
    ? await repository.listerParProprietaire(tenantId, session.user.id)
    : await repository.listerParTenant(tenantId);

  return {
    nom: session.user.name,
    estProprietaire,
    releves: releves.map((releve) => ({
      id: releve.id,
      periodeLabel: libellePeriodeReleve(releve.moisDebut, releve.moisFin),
      periode: releve.periode,
      proprietaireNom: releve.proprietaireNom,
      genereLe: releve.genereAt.slice(0, 10),
      ca: formaterEuros(releve.totalCaCentimes),
      commission: formaterEuros(releve.totalCommissionCentimes),
      charges: formaterEuros(releve.totalChargesCentimes),
      net: formaterEuros(releve.totalNetCentimes),
      netNegatif: releve.totalNetCentimes < 0,
    })),
  };
};
