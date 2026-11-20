/**
 * FR-016 (spec 006) — journaux applicatifs consultables sans SSH.
 *
 * Les dernières lignes persistées par le logger (stdout + table), lues via la
 * connexion applicative (table plateforme). Filtres : niveau et recherche sur
 * le message. Si la table est absente (migration non appliquée), la page le
 * dit au lieu d'échouer.
 */
import { logErreur } from "@/lib/logger";
import { listerJournaux, type EntreeJournalApplicatif } from "@/lib/server/journaux";
import { requireSuperAdmin } from "@/lib/server/session";
import type { PageServerLoad } from "./$types";

const NIVEAUX = new Set(["info", "error"]);

export const load: PageServerLoad = async (event) => {
  requireSuperAdmin(event);
  const niveauBrut = event.url.searchParams.get("niveau") ?? "";
  const niveau = NIVEAUX.has(niveauBrut)
    ? (niveauBrut as "info" | "error")
    : undefined;
  const recherche = event.url.searchParams.get("q")?.trim() ?? "";

  let entrees: EntreeJournalApplicatif[] = [];
  let indisponible = false;
  try {
    entrees = await listerJournaux({
      niveau,
      recherche: recherche || undefined,
      limite: 200,
    });
  } catch (erreur) {
    logErreur("supervision.journaux.lecture", erreur);
    indisponible = true;
  }

  return {
    entrees: entrees.map((entree) => ({
      id: entree.id,
      date: entree.createdAt.toISOString().slice(0, 16).replace("T", " "),
      niveau: entree.niveau,
      message: entree.message,
      requestId: entree.requestId,
      contexteVide: Object.keys(entree.contexte).length === 0,
      contexteTexte: JSON.stringify(entree.contexte, null, 2),
    })),
    indisponible,
    filtres: { niveau: niveau ?? "", q: recherche },
  };
};
