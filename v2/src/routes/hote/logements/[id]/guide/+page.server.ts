/**
 * T603 — Éditeur de guide structuré pour un logement.
 *
 * Écran staff HTML-first : formulaire natif par section et par langue.
 * Actions serveur : enregistrer un contenu, supprimer un contenu,
 * changer la langue par défaut du guide.
 */
import { error, fail } from "@sveltejs/kit";
import { and, eq } from "drizzle-orm";
import {
  LANGUES_GUIDE,
  ORDRE_SECTIONS_GUIDE,
  langueGuideValide,
  sectionGuideValide,
  validerContenuSection,
} from "@/domain/guide-voyageur";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleGuideContenusRepository } from "@/infrastructure/db/repositories/guides-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs, logements } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { exigerConfirmation } from "@/lib/server/confirmation";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const LIBELLES_SECTIONS: Record<string, string> = {
  arrivee: "Arrivée",
  wifi: "WiFi",
  sejour: "Séjour",
  depart: "Départ",
  urgence: "Urgence",
};

const LIBELLES_LANGUES: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  it: "Italiano",
  de: "Deutsch",
  nl: "Nederlands",
};

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logement = await new DrizzleLogementRepository().trouverParId(
    tenantId,
    event.params.id,
  );
  if (!logement) error(404, "Logement introuvable");

  const langueParam = event.url.searchParams.get("langue");
  const langueActive =
    langueParam && langueGuideValide(langueParam)
      ? langueParam
      : (logement.guideLangueDefaut ?? "fr");

  const contenus = await new DrizzleGuideContenusRepository().listerParLogement(
    tenantId,
    logement.id,
  );

  // Organiser les contenus par section pour la langue active
  const sections = ORDRE_SECTIONS_GUIDE.map((section) => {
    const contenu = contenus.find(
      (c) => c.section === section && c.langue === langueActive,
    );
    return {
      section,
      libelle: LIBELLES_SECTIONS[section] ?? section,
      titre: contenu?.titre ?? "",
      corps: contenu?.corps ?? "",
      existe: !!contenu,
    };
  });

  // Langues qui ont au moins un contenu
  const languesAvecContenu = new Set(contenus.map((c) => c.langue));

  return {
    logement: {
      id: logement.id,
      code: logement.code,
      nom: logement.nom,
    },
    langueActive,
    langueDefaut: logement.guideLangueDefaut ?? "fr",
    sections,
    langues: LANGUES_GUIDE.map((l) => ({
      code: l,
      libelle: LIBELLES_LANGUES[l] ?? l,
      aContenu: languesAvecContenu.has(l),
    })),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const section = String(donnees.get("section") ?? "");
    const langue = String(donnees.get("langue") ?? "");
    const titre = String(donnees.get("titre") ?? "").trim();
    const corps = String(donnees.get("corps") ?? "").trim();

    if (!sectionGuideValide(section)) {
      return fail(400, { ok: false, message: "Section invalide." });
    }
    if (!langueGuideValide(langue)) {
      return fail(400, { ok: false, message: "Langue invalide." });
    }

    const erreurs = validerContenuSection({
      langue,
      titre,
      corps,
    });
    if (erreurs.length > 0) {
      return fail(400, { ok: false, message: erreurs.join(" ") });
    }

    try {
      await new DrizzleGuideContenusRepository().enregistrer(tenantId, {
        logementId,
        section,
        langue,
        titre,
        corps,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "guide.section",
          cible: logementId,
          ref: `${section}:${langue}`,
          payload: {},
        }),
      );

      return { ok: true, message: `Section « ${LIBELLES_SECTIONS[section]} » enregistrée (${LIBELLES_LANGUES[langue]}).` };
    } catch (erreur) {
      logErreur("guide.enregistrer", erreur, { tenantId, logementId, section, langue });
      return fail(500, { ok: false, message: "Erreur inattendue. Réessayez." });
    }
  },

  supprimer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const section = String(donnees.get("section") ?? "");
    const langue = String(donnees.get("langue") ?? "");

    if (!sectionGuideValide(section) || !langueGuideValide(langue)) {
      return fail(400, { ok: false, message: "Paramètres invalides." });
    }

    // Deux étapes (FR-039) : sans `confirmation`, rien n'est supprimé.
    exigerConfirmation(donnees, {
      action: "supprimer",
      retour: `/hote/logements/${encodeURIComponent(logementId)}/guide?langue=${encodeURIComponent(langue)}`,
      cible: `${section}:${langue}`,
    });

    try {
      await new DrizzleGuideContenusRepository().supprimer(
        tenantId,
        logementId,
        section,
        langue,
      );

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "guide.supprimer",
          cible: logementId,
          ref: `${section}:${langue}`,
          payload: {},
        }),
      );

      return { ok: true, message: `Section « ${LIBELLES_SECTIONS[section]} » supprimée (${LIBELLES_LANGUES[langue]}).` };
    } catch (erreur) {
      logErreur("guide.supprimer", erreur, { tenantId, logementId, section, langue });
      return fail(500, { ok: false, message: "Erreur inattendue. Réessayez." });
    }
  },

  langueDefaut: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const langue = String(donnees.get("langueDefaut") ?? "");

    if (!langueGuideValide(langue)) {
      return fail(400, { ok: false, message: "Langue invalide." });
    }

    try {
      await withTenant(tenantId, async (tx) => {
        await tx
          .update(logements)
          .set({ guideLangueDefaut: langue, updatedAt: new Date() })
          .where(and(eq(logements.tenantId, tenantId), eq(logements.id, logementId)));
      });

      return { ok: true, message: `Langue par défaut du guide : ${LIBELLES_LANGUES[langue]}.` };
    } catch (erreur) {
      logErreur("guide.langueDefaut", erreur, { tenantId, logementId, langue });
      return fail(500, { ok: false, message: "Erreur inattendue. Réessayez." });
    }
  },
} satisfies Actions;
