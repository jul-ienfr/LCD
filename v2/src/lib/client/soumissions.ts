/**
 * Verrou des soumissions côté navigateur (FR-040, spec 006).
 *
 * Dès qu'un formulaire POST part, ses boutons sont désactivés et la zone passe
 * en état d'attente : plus de second clic possible, et l'utilisateur voit que
 * quelque chose se passe. Un rejeu dans les deux secondes est refusé côté
 * client comme côté serveur (`src/lib/server/anti-doublon.ts`) ; au-delà, une
 * correction après échec de validation reste possible.
 *
 * Sans JavaScript, rien n'est bloqué côté navigateur : le serveur seul écarte
 * le doublon. Le module ne touche ni aux formulaires GET (recherche, filtres)
 * ni aux liens.
 */

export const ATTENTE_SOUMISSION: Record<string, string> = {
  fr: "Envoi…",
  en: "Sending…",
  es: "Enviando…",
  it: "Invio…",
  de: "Senden…",
};

const FENETRE_MS = 2_000;
const ATTRIBUT_LIBELLE = "data-libelle-initial";

/** Seules les soumissions POST sont verrouillées (jamais la recherche GET). */
export function doitVerrouiller(methode: string | null | undefined): boolean {
  return (methode ?? "get").trim().toLowerCase() === "post";
}

/** Vrai si la même soumission revient trop tôt sur le même formulaire. */
export function rejeuTropRapide(
  precedent: number | undefined,
  maintenant: number,
  fenetreMs: number = FENETRE_MS,
): boolean {
  return precedent !== undefined && maintenant - precedent < fenetreMs;
}

/** Libellé d'attente dans la langue de la page, français par défaut. */
export function libelleAttente(langue: string | null | undefined): string {
  if (langue && Object.hasOwn(ATTENTE_SOUMISSION, langue)) {
    return ATTENTE_SOUMISSION[langue] as string;
  }
  return ATTENTE_SOUMISSION.fr ?? "Envoi…";
}

function languePage(): string {
  return document.documentElement.lang || "fr";
}

const TYPES_SANS_VALEUR = new Set([
  "password",
  "file",
  "submit",
  "button",
  "image",
  "reset",
]);

function texteUnique(valeur: unknown): string {
  if (Array.isArray(valeur)) return String(valeur[0] ?? "");
  return valeur === null || valeur === undefined ? "" : String(valeur);
}

function listeValeurs(valeur: unknown): string[] {
  if (Array.isArray(valeur)) return valeur.map(String);
  if (valeur === null || valeur === undefined) return [];
  return [String(valeur)];
}

function appliquerChamp(champ: Element, valeur: unknown): boolean {
  if (champ instanceof HTMLInputElement) {
    if (TYPES_SANS_VALEUR.has(champ.type)) return false;
    if (champ.type === "checkbox" || champ.type === "radio") {
      champ.checked = listeValeurs(valeur).includes(champ.value);
    } else {
      champ.value = texteUnique(valeur);
    }
    return true;
  }
  if (champ instanceof HTMLTextAreaElement) {
    champ.value = texteUnique(valeur);
    return true;
  }
  if (champ instanceof HTMLSelectElement) {
    const retenues = new Set(listeValeurs(valeur));
    for (const option of champ.options) option.selected = retenues.has(option.value);
    return true;
  }
  return false;
}

const CLES_LIGNE = [
  "id",
  "missionId",
  "filId",
  "reservationId",
  "demandeId",
  "logementId",
  "planId",
] as const;

function porteeFormulaire(
  valeurs: Record<string, unknown>,
  racine: ParentNode,
): ParentNode {
  if (typeof location === "undefined") return racine;
  let action = "";
  try {
    action =
      [...new URLSearchParams(location.search).keys()].find((cle) =>
        cle.startsWith("/"),
      ) ?? "";
  } catch {
    return racine;
  }
  if (!action) return racine;
  const candidats = [...racine.querySelectorAll("form")].filter((form) =>
    (form.getAttribute("action") ?? "").includes(`?/${action}`),
  );
  if (candidats.length <= 1) return candidats[0] ?? racine;

  // Plusieurs formulaires portent la même action (une ligne par élément) :
  // la clé de ligne soumise désigne la bonne ligne.
  for (const cle of CLES_LIGNE) {
    const attendue = valeurs[cle];
    if (attendue === undefined) continue;
    const texte = String(Array.isArray(attendue) ? attendue[0] : attendue);
    const trouve = candidats.find((form) => {
      const champ = form.querySelector(`[name="${cle}"]`);
      return (
        (champ instanceof HTMLInputElement ||
          champ instanceof HTMLSelectElement) &&
        champ.value === texte
      );
    });
    if (trouve) return trouve;
  }
  return candidats[0] ?? racine;
}

/**
 * Replace dans la page les valeurs d'une saisie refusée (FR-041). Le nom du
 * champ fait le lien : aucune page n'a besoin de lier chaque champ. Les
 * secrets (mot de passe, code, jeton) ne sont jamais réappliqués.
 */
export function appliquerValeursSaisie(
  valeurs: Record<string, unknown> | null | undefined,
  racine: ParentNode = document,
  portee?: ParentNode,
): number {
  if (!valeurs) return 0;
  const cible = portee ?? porteeFormulaire(valeurs, racine);
  let remplis = 0;
  for (const [nom, valeur] of Object.entries(valeurs)) {
    let champs: NodeListOf<Element>;
    try {
      champs = cible.querySelectorAll(`[name="${CSS.escape(nom)}"]`);
    } catch {
      continue;
    }
    for (const champ of champs) {
      if (appliquerChamp(champ, valeur)) remplis += 1;
    }
  }
  return remplis;
}

function restaurer(element: HTMLElement): void {
  const libelle = element.getAttribute(ATTRIBUT_LIBELLE);
  if (libelle !== null) {
    element.textContent = libelle;
    element.removeAttribute(ATTRIBUT_LIBELLE);
  }
  element.removeAttribute("aria-disabled");
  element.classList.remove("soumission-en-attente");
  if (
    element instanceof HTMLButtonElement ||
    element instanceof HTMLInputElement
  ) {
    element.disabled = false;
  }
}

/**
 * Installe le verrou sur les soumissions POST de `racine`. Renvoie la fonction
 * de désinstallation (utilisée par `onMount`).
 */
export function installerVerrouSoumissions(
  racine: Document = document,
): () => void {
  let dernierEnvoi = new WeakMap<HTMLFormElement, number>();

  function onsubmit(evenement: Event): void {
    const evt = evenement as SubmitEvent;
    const form = evt.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!doitVerrouiller(form.getAttribute("method"))) return;

    const maintenant = Date.now();
    if (rejeuTropRapide(dernierEnvoi.get(form), maintenant)) {
      evt.preventDefault();
      return;
    }
    dernierEnvoi.set(form, maintenant);

    form.setAttribute("aria-busy", "true");
    form.classList.add("soumission-en-attente");
    const boutons = evt.submitter
      ? [evt.submitter]
      : [
          ...form.querySelectorAll<HTMLElement>(
            'button[type="submit"], button:not([type]), input[type="submit"]',
          ),
        ];
    const libelle = libelleAttente(languePage());
    for (const bouton of boutons) {
      if (!(bouton instanceof HTMLElement)) continue;
      bouton.classList.add("soumission-en-attente");
      if (bouton.childElementCount === 0 && bouton.textContent?.trim()) {
        bouton.setAttribute(ATTRIBUT_LIBELLE, bouton.textContent);
        bouton.textContent = libelle;
      }
    }

    // Les champs du bouton (nom/valeur) doivent encore partir avec le
    // formulaire : la désactivation attend donc la fin de l'événement.
    setTimeout(() => {
      for (const bouton of boutons) {
        if (!(bouton instanceof HTMLElement)) continue;
        bouton.setAttribute("aria-disabled", "true");
        if (
          bouton instanceof HTMLButtonElement ||
          bouton instanceof HTMLInputElement
        ) {
          bouton.disabled = true;
        }
      }
    }, 0);
  }

  function onpageshow(evenement: Event): void {
    if (!(evenement as PageTransitionEvent).persisted) return;
    for (const element of racine.querySelectorAll<HTMLElement>(
      ".soumission-en-attente",
    )) {
      restaurer(element);
    }
    for (const form of racine.querySelectorAll("form")) {
      form.removeAttribute("aria-busy");
      form.classList.remove("soumission-en-attente");
    }
    dernierEnvoi = new WeakMap();
  }

  racine.addEventListener("submit", onsubmit, true);
  window.addEventListener("pageshow", onpageshow);
  return () => {
    racine.removeEventListener("submit", onsubmit, true);
    window.removeEventListener("pageshow", onpageshow);
  };
}
