import { error, fail } from "@sveltejs/kit";
import { ChangerStatutOffre } from "@/application/use-cases/changer-statut-offre";
import { ChangerStatutProspect } from "@/application/use-cases/changer-statut-prospect";
import { CreerOffre } from "@/application/use-cases/creer-offre";
import { ErreurMetier } from "@/domain/erreurs";
import {
  TRANSITIONS_OFFRE,
  type StatutOffre,
} from "@/domain/offre";
import {
  TRANSITIONS_PROSPECT,
  type StatutProspect,
} from "@/domain/prospect";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleOffreRepository } from "@/infrastructure/db/repositories/offre-repository";
import { DrizzleProspectRepository } from "@/infrastructure/db/repositories/prospect-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const STATUTS_PROSPECT: StatutProspect[] = [
  "nouveau",
  "qualifie",
  "visite",
  "offre",
  "gagne",
  "perdu",
];
const STATUTS_OFFRE: StatutOffre[] = [
  "brouillon",
  "envoyee",
  "acceptee",
  "refusee",
];

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["commercial", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const prospect = await new DrizzleProspectRepository().trouverParId(
    tenantId,
    event.params.id,
  );
  if (!prospect) error(404, "Prospect introuvable");

  const [offres, logements] = await Promise.all([
    new DrizzleOffreRepository().listerParProspect(tenantId, prospect.id),
    new DrizzleLogementRepository().listerParTenant(tenantId),
  ]);
  const parLogement = new Map(logements.map((logement) => [logement.id, logement]));

  return {
    prospect: {
      id: prospect.id,
      nom: prospect.nom,
      email: prospect.email,
      telephone: prospect.telephone,
      source: prospect.source,
      statut: prospect.statut,
      notes: prospect.notes,
    },
    transitionsProspect: TRANSITIONS_PROSPECT[prospect.statut],
    offres: offres.map((offre) => ({
      id: offre.id,
      titre: offre.titre,
      statut: offre.statut,
      montant: formaterEuros(offre.montantCentimes),
      logement: offre.logementId ? parLogement.get(offre.logementId)?.nom ?? null : null,
      notes: offre.notes,
      transitions: TRANSITIONS_OFFRE[offre.statut],
    })),
    logements: logements.map((logement) => ({ id: logement.id, nom: logement.nom })),
  };
};

export const actions = {
  statutProspect: async (event) => {
    const session = requireRole(event, ["commercial", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const prospectId = String(donnees.get("prospectId") ?? "");
    const statut = String(donnees.get("statut") ?? "") as StatutProspect;
    if (!prospectId || !STATUTS_PROSPECT.includes(statut)) {
      return fail(400, { ok: false, message: "Statut invalide." });
    }
    try {
      const prospect = await new ChangerStatutProspect(
        new DrizzleProspectRepository(),
      ).executer({ tenantId, prospectId, statut });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "prospect.statut",
          cible: prospect.id,
          ref: prospect.email ?? prospect.nom,
          payload: { statut: prospect.statut },
        }),
      );
      return { ok: true, message: `Statut : ${prospect.statut}.` };
    } catch (error) {
      if (error instanceof ErreurMetier) return fail(400, { ok: false, message: error.message });
      logErreur("commercial.statutProspect", error, { tenantId, prospectId });
      return fail(500, { ok: false, message: "Erreur inattendue." });
    }
  },

  creerOffre: async (event) => {
    const session = requireRole(event, ["commercial", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const prospectId = String(donnees.get("prospectId") ?? "");
    const logementId = String(donnees.get("logementId") ?? "") || null;
    const montantCentimes = centimesDepuisSaisie(
      String(donnees.get("montantEuros") ?? ""),
    );
    if (montantCentimes === null) {
      return fail(400, { ok: false, message: "Montant invalide (ex. 149 ou 1490,50)." });
    }
    try {
      if (logementId) {
        const logement = await new DrizzleLogementRepository().trouverParId(
          tenantId,
          logementId,
        );
        if (!logement) return fail(400, { ok: false, message: "Logement introuvable." });
      }
      const offre = await new CreerOffre(
        new DrizzleOffreRepository(),
        new DrizzleProspectRepository(),
      ).executer({
        tenantId,
        prospectId,
        logementId,
        titre: String(donnees.get("titre") ?? ""),
        montantCentimes,
        notes: String(donnees.get("notes") ?? ""),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "offre.creer",
          cible: offre.id,
          ref: offre.titre,
          payload: { prospectId, montantCentimes },
        }),
      );
      return { ok: true, message: `Offre « ${offre.titre} » créée.` };
    } catch (error) {
      if (error instanceof ErreurMetier) return fail(400, { ok: false, message: error.message });
      logErreur("commercial.creerOffre", error, { tenantId, prospectId });
      return fail(500, { ok: false, message: "Erreur inattendue." });
    }
  },

  statutOffre: async (event) => {
    const session = requireRole(event, ["commercial", "admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const offreId = String(donnees.get("offreId") ?? "");
    const statut = String(donnees.get("statut") ?? "") as StatutOffre;
    if (!offreId || !STATUTS_OFFRE.includes(statut)) {
      return fail(400, { ok: false, message: "Statut invalide." });
    }
    try {
      const offre = await new ChangerStatutOffre(
        new DrizzleOffreRepository(),
      ).executer({ tenantId, offreId, statut });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "offre.statut",
          cible: offre.id,
          ref: offre.titre,
          payload: { statut: offre.statut },
        }),
      );
      return { ok: true, message: `Offre : ${offre.statut}.` };
    } catch (error) {
      if (error instanceof ErreurMetier) return fail(400, { ok: false, message: error.message });
      logErreur("commercial.statutOffre", error, { tenantId, offreId });
      return fail(500, { ok: false, message: "Erreur inattendue." });
    }
  },
} satisfies Actions;
