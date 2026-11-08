import { isRedirect, redirect } from "@sveltejs/kit";
import {
  AvancerSinistre,
  DeclarerSinistre,
} from "@/application/use-cases/sinistre";
import { ErreurMetier } from "@/domain/erreurs";
import { centimesDepuisSaisie } from "@/lib/format";
import { aujourdHuiIso } from "@/domain/objet-trouve";
import {
  LIBELLES_STATUT_SINISTRE,
  LIBELLES_TYPE_SINISTRE,
  montantAttendu,
  resumeSinistres,
} from "@/domain/sinistre";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleSinistresRepository } from "@/infrastructure/db/repositories/sinistres-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsExploitation } from "@/lib/i18n-exploitation";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "");
}

function retour(logementId: string, suffixe: string): never {
  redirect(
    303,
    `/hote/sinistres?logement=${encodeURIComponent(logementId)}&${suffixe}`,
  );
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const logement =
    logements.find(
      (entree) => entree.id === event.url.searchParams.get("logement"),
    ) ?? logements[0];
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  if (!logement) {
    return {
      langue,
      t: traductionsExploitation(langue),
      vide: true,
      logements: [],
      logement: null,
      ref: `sinistre-${crypto.randomUUID()}`,
      aujourdHui: aujourdHuiIso(),
      sinistres: [],
      resume: resumeSinistres([]),
      ok: event.url.searchParams.get("ok"),
      erreur: event.url.searchParams.get("erreur"),
    };
  }

  const sinistres = await new DrizzleSinistresRepository().listerParLogement(
    tenantId,
    logement.id,
  );

  return {
    langue,
    t: traductionsExploitation(langue),
    vide: false,
    logements: logements.map((entree) => ({
      id: entree.id,
      nom: entree.nom,
    })),
    logement: { id: logement.id, nom: logement.nom },
    ref: `sinistre-${crypto.randomUUID()}`,
    aujourdHui: aujourdHuiIso(),
    sinistres: sinistres.map((sinistre) => ({
      id: sinistre.id,
      date: sinistre.date,
      type: sinistre.type,
      libelleType: LIBELLES_TYPE_SINISTRE[sinistre.type],
      statut: sinistre.statut,
      libelleStatut: LIBELLES_STATUT_SINISTRE[sinistre.statut],
      montantEstimeCentimes: sinistre.montantEstimeCentimes,
      franchiseCentimes: sinistre.franchiseCentimes,
      montantAttenduCentimes: montantAttendu(sinistre),
      montantIndemniseCentimes: sinistre.montantIndemniseCentimes,
      description: sinistre.description,
      numeroDeclaration: sinistre.numeroDeclaration,
    })),
    resume: resumeSinistres(sinistres),
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  declarer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");

    try {
      const montant = centimesDepuisSaisie(texte(donnees, "montantEstime"));
      if (montant === null) {
        throw new ErreurMetier(
          "SINISTRE_INVALIDE",
          "Le montant estimé est invalide.",
        );
      }
      const franchiseBrute = texte(donnees, "franchise").trim();
      const franchise = franchiseBrute
        ? centimesDepuisSaisie(franchiseBrute)
        : 0;
      if (franchise === null) {
        throw new ErreurMetier(
          "SINISTRE_INVALIDE",
          "La franchise est invalide.",
        );
      }

      const sinistre = await new DeclarerSinistre(
        new DrizzleSinistresRepository(),
        new DrizzleLogementRepository(),
      ).executer({
        tenantId,
        logementId,
        ref:
          texte(donnees, "ref").trim() || `sinistre-${crypto.randomUUID()}`,
        type: texte(donnees, "type"),
        date: texte(donnees, "date"),
        description: texte(donnees, "description"),
        montantEstimeCentimes: montant,
        franchiseCentimes: franchise,
        numeroDeclaration: texte(donnees, "numeroDeclaration"),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "sinistre.declarer",
          cible: sinistre.id,
          payload: {
            type: sinistre.type,
            montantEstimeCentimes: sinistre.montantEstimeCentimes,
            logementId,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("sinistres.declarer", error, { tenantId, logementId });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=declare");
  },

  avancer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const id = texte(donnees, "id");
    const montantBrut = texte(donnees, "montantIndemnise").trim();

    try {
      const montantIndemnise = montantBrut
        ? centimesDepuisSaisie(montantBrut)
        : null;
      if (montantBrut && montantIndemnise === null) {
        throw new ErreurMetier(
          "SINISTRE_INVALIDE",
          "Le montant indemnisé est invalide.",
        );
      }

      const sinistre = await new AvancerSinistre(
        new DrizzleSinistresRepository(),
      ).executer({
        tenantId,
        id,
        montantIndemniseCentimes: montantIndemnise,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "sinistre.statut",
          cible: sinistre.id,
          payload: {
            statut: sinistre.statut,
            montantIndemniseCentimes: sinistre.montantIndemniseCentimes,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("sinistres.avancer", error, { tenantId, cible: id });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=statut");
  },
} satisfies Actions;
