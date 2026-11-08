import { fail, isRedirect, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import {
  accentValidePourTheme,
  normaliserApparence,
} from "@/domain/apparence/validation";
import { THEMES, estThemeValide, themeParId } from "@/domain/apparence/registre";
import { auditLogs } from "@/infrastructure/db/schema";
import { withTenant } from "@/infrastructure/db/client";
import { marque } from "@/lib/branding";
import { logErreur } from "@/lib/logger";
import {
  apparencePourRequete,
  enregistrerBrouillonApparence,
  lireApparenceBrouillon,
  lireVersionPubliee,
  listerVersionsApparence,
  publierApparence,
  revenirApparence,
} from "@/lib/server/apparence";
import {
  effacerCookieApercuApparence,
  poserCookieApercuApparence,
} from "@/lib/server/apercu-apparence";
import {
  requireSuperAdmin,
  tenantIdDeSession,
} from "@/lib/server/session";

async function auditer(
  session: ReturnType<typeof requireSuperAdmin>,
  action: string,
  cible: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const tenantId = tenantIdDeSession(session);
  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: session.user.email,
      action,
      cible,
      payload,
    }),
  );
}

function texte(donnees: FormData, cle: string): string {
  return String(donnees.get(cle) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  requireSuperAdmin(event);
  const { apparence, apercu } = await apparencePourRequete(event);
  const [versionPubliee, brouillon, versions] = await Promise.all([
    lireVersionPubliee(),
    lireApparenceBrouillon(),
    listerVersionsApparence(30),
  ]);

  const publiee = versionPubliee
    ? normaliserApparence(versionPubliee.configuration)
    : apparence;
  const brouillonApparence = brouillon
    ? normaliserApparence(brouillon.configuration)
    : null;

  return {
    apparence: brouillonApparence ?? publiee,
    publiee,
    brouillon: brouillon
      ? {
          id: brouillon.id,
          creeLe: brouillon.creeLe,
          creePar: brouillon.creePar,
        }
      : null,
    versionPubliee: versionPubliee
      ? {
          id: versionPubliee.id,
          version: versionPubliee.version,
          publieLe: versionPubliee.publieLe,
          publiePar: versionPubliee.publiePar,
          motif: versionPubliee.motif,
        }
      : null,
    versions: versions.map((version) => ({
      id: version.id,
      version: version.version,
      statut: version.statut,
      creeLe: version.creeLe,
      publieLe: version.publieLe,
      publiePar: version.publiePar,
      motif: version.motif,
      apparence: normaliserApparence(version.configuration),
    })),
    themes: THEMES,
    apercu,
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const themeId = texte(donnees, "themeId");
    const accentActif = donnees.get("accentActif") === "on";
    const accent = accentActif ? texte(donnees, "accent") : "";

    if (!estThemeValide(themeId)) {
      return fail(400, { message: "Thème inconnu." });
    }
    const theme = themeParId(themeId)!;
    if (accent && !accentValidePourTheme(accent, theme)) {
      return fail(400, {
        message:
          "Cette couleur d’accent n’atteint pas 4,5:1 sur le thème, en clair et en sombre.",
      });
    }

    const apparence = normaliserApparence(
      {
        themeId,
        accent,
        identite: {
          nom: texte(donnees, "nom"),
          logoUrl: texte(donnees, "logoUrl"),
          emailContact: texte(donnees, "emailContact"),
          telephoneContact: texte(donnees, "telephoneContact"),
          adresseContact: texte(donnees, "adresseContact"),
        },
      },
      { nom: marque(), logoUrl: null, emailContact: null, telephoneContact: null, adresseContact: null, accent: null },
    );

    try {
      const version = await enregistrerBrouillonApparence(
        apparence,
        session.user.email,
      );
      await auditer(session, "apparence.brouillon", version.id, {
        themeId: apparence.themeId,
        accent: apparence.accent,
      });
      return {
        ok: true,
        message: `Brouillon enregistré : ${theme.nom}. Publiez-le pour l’appliquer à tout le site.`,
      };
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("apparence.enregistrer", error);
      return fail(500, {
        message: "Enregistrement impossible. Vérifiez la base et réessayez.",
      });
    }
  },

  publier: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const motif = texte(donnees, "motif") || null;
    const brouillon = await lireApparenceBrouillon();
    if (!brouillon) {
      return fail(400, { message: "Aucun brouillon à publier." });
    }
    try {
      const version = await publierApparence(
        normaliserApparence(brouillon.configuration),
        session.user.email,
        motif,
      );
      effacerCookieApercuApparence(event);
      await auditer(session, "apparence.publier", version.id, {
        version: version.version,
        motif,
      });
      return {
        ok: true,
        message: `Version ${version.version} publiée pour tout le site.`,
      };
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("apparence.publier", error);
      return fail(500, { message: "Publication impossible." });
    }
  },

  revenir: async (event) => {
    const session = requireSuperAdmin(event);
    const donnees = await event.request.formData();
    const versionId = texte(donnees, "versionId");
    const motif = texte(donnees, "motif") || null;
    if (!versionId) {
      return fail(400, { message: "Version manquante." });
    }
    try {
      const version = await revenirApparence(versionId, session.user.email, motif);
      effacerCookieApercuApparence(event);
      await auditer(session, "apparence.revenir", version.id, {
        version: version.version,
        motif,
      });
      return {
        ok: true,
        message: `Version ${version.version} republiée.`,
      };
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("apparence.revenir", error);
      return fail(500, { message: "Retour impossible." });
    }
  },

  apercu: async (event) => {
    const session = requireSuperAdmin(event);
    poserCookieApercuApparence(event, session.user.id);
    redirect(303, "/");
  },

  fermer: async (event) => {
    requireSuperAdmin(event);
    effacerCookieApercuApparence(event);
    redirect(303, "/supervision/apparence");
  },
} satisfies Actions;
