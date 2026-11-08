import { isRedirect, redirect } from "@sveltejs/kit";
import {
  EnregistrerPhrase,
  InstallerPhrasesDefaut,
  SupprimerPhrase,
} from "@/application/use-cases/phrase";
import { ErreurMetier } from "@/domain/erreurs";
import {
  appliquerVariables,
  PHRASES_DEFAUT,
  type VariablesPhrase,
} from "@/domain/phrase";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePhrasesRepository } from "@/infrastructure/db/repositories/phrases-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const EXEMPLE: VariablesPhrase = {
  voyageur: "Camille",
  logement: "le logement",
  debut: "01/12/2026",
  fin: "05/12/2026",
  heure: "15:00",
};

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "");
}

function retour(logementId: string, suffixe: string): never {
  redirect(
    303,
    `/hote/phrases?logement=${encodeURIComponent(logementId)}&${suffixe}`,
  );
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const logement =
    logements.find(
      (entree) => entree.id === event.url.searchParams.get("logement"),
    ) ?? logements[0];

  if (!logement) {
    return {
      langue,
      vide: true,
      logements: [],
      logement: null,
      ref: `phrase-${crypto.randomUUID()}`,
      phrases: [],
      enEdition: null,
      modeles: [],
      exemple: EXEMPLE,
      ok: event.url.searchParams.get("ok"),
      erreur: event.url.searchParams.get("erreur"),
    };
  }

  const phrases = await new DrizzlePhrasesRepository().listerParLogement(
    tenantId,
    logement.id,
  );
  const enEdition = phrases.find(
    (phrase) => phrase.id === event.url.searchParams.get("phrase"),
  );
  const exemple: VariablesPhrase = { ...EXEMPLE, logement: logement.nom };

  return {
    langue,
    vide: false,
    logements: logements.map((entree) => ({
      id: entree.id,
      nom: entree.nom,
    })),
    logement: { id: logement.id, nom: logement.nom },
    ref: `phrase-${crypto.randomUUID()}`,
    phrases: phrases.map((phrase) => ({
      id: phrase.id,
      ref: phrase.ref,
      categorie: phrase.categorie,
      titre: phrase.titre,
      contenu: phrase.contenu,
      apercu: appliquerVariables(phrase.contenu, exemple),
    })),
    enEdition: enEdition
      ? {
          id: enEdition.id,
          ref: enEdition.ref,
          categorie: enEdition.categorie,
          titre: enEdition.titre,
          contenu: enEdition.contenu,
        }
      : null,
    modeles: PHRASES_DEFAUT.map((modele) => ({
      code: modele.code,
      categorie: modele.categorie,
      titre: modele.titre,
      apercu: appliquerVariables(modele.contenu, exemple),
    })),
    exemple,
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const id = texte(donnees, "id").trim();
    let phraseRef = "";

    try {
      const phrase = await new EnregistrerPhrase(
        new DrizzlePhrasesRepository(),
      ).executer({
        tenantId,
        logementId,
        id: id || undefined,
        ref: texte(donnees, "ref"),
        categorie: texte(donnees, "categorie"),
        titre: texte(donnees, "titre"),
        contenu: texte(donnees, "contenu"),
      });
      phraseRef = phrase.ref;

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "phrase.enregistrer",
          cible: phrase.id,
          ref: phrase.ref,
          payload: { categorie: phrase.categorie, logementId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("phrases.enregistrer", error, { tenantId });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, `ok=enregistre&ref=${encodeURIComponent(phraseRef)}`);
  },

  supprimer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const id = texte(donnees, "id");

    try {
      await new SupprimerPhrase(new DrizzlePhrasesRepository()).executer(
        tenantId,
        id,
      );
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "phrase.supprimer",
          cible: id,
          payload: { logementId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("phrases.supprimer", error, { tenantId, cible: id });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=supprime");
  },

  installer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    let nombre = 0;

    try {
      const creees = await new InstallerPhrasesDefaut(
        new DrizzlePhrasesRepository(),
      ).executer({ tenantId, logementId });
      nombre = creees.length;

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "phrase.installer_modeles",
          cible: logementId,
          payload: { nombre },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("phrases.installer", error, { tenantId });
      retour(logementId, "erreur=inattendu");
    }

    retour(logementId, "ok=modeles");
  },
} satisfies Actions;
