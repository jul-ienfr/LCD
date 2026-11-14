/**
 * Mesure ergonomique bas niveau partagée par les scripts d'audit (T031).
 *
 * Contrat : `contracts/ergonomie.md`
 * - cible tactile ≥ 44 × 44 px (largeur OU hauteur sous le seuil = échec) ;
 * - les liens de texte inline (dans un paragraphe) sont hors périmètre ;
 * - aucun défilement horizontal à 320 px.
 *
 * Le fichier exporte une chaîne de fonction *auto-portante* (`collecterCibles`)
 * exécutée dans le navigateur par `page.evaluate`. Elle ne capture aucune
 * variable de module : tout entre par l'argument `options`.
 */

export const CONTROLES_SELECTEUR = [
  "a",
  "button",
  "input",
  "select",
  "textarea",
  "summary",
  '[role="button"]',
].join(",");

export const LIEN_INLINE_SELECTEUR = "p a, li a, label a, figcaption a";

/**
 * Collecte les cibles tactiles et le débordement horizontal.
 *
 * @param {object} options
 * @param {string} options.controles       sélecteur des contrôles interactifs
 * @param {number} options.seuilPx         seuil minimal de cible (44 px)
 * @param {string} options.liensInline     sélecteur des liens inline exclus
 * @param {boolean} options.inclureLiensInline
 * @returns {{
 *   overflowPx: number,
 *   scrollWidth: number,
 *   clientWidth: number,
 *   controleCount: number,
 *   smallTargets: Array<Record<string, unknown>>,
 *   exclusionsLiensInline: number,
 * }}
 */
export function collecterCibles(options) {
  const seuil = options.seuilPx;
  const doc = document.documentElement;

  const visible = (element) => {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      style.visibility !== "hidden" &&
      style.display !== "none" &&
      style.opacity !== "0"
    );
  };

  const identifiant = (element) =>
    [element.tagName.toLowerCase(), element.id ? `#${element.id}` : ""].join("");

  const libelle = (element) => {
    const brut =
      element.getAttribute("aria-label") ??
      element.textContent ??
      element.getAttribute("name") ??
      element.getAttribute("title") ??
      element.getAttribute("placeholder") ??
      element.getAttribute("value") ??
      "";
    return String(brut).replace(/\s+/g, " ").trim().slice(0, 80);
  };

  const tous = [...document.querySelectorAll(options.controles)];
  const smallTargets = [];
  let exclusionsLiensInline = 0;
  let exceptionsControlesNatifs = 0;
  let controleCount = 0;

  /**
   * Zone réellement cliquable d'une case à cocher ou d'un bouton radio : ce
   * n'est pas le carré dessiné par le navigateur, mais l'étiquette qui le porte.
   * WCAG 2.5.8 exclut la taille « déterminée par l'agent utilisateur » : on
   * vérifie donc l'étiquette associée, et on ne compte le contrôle en échec
   * que si cette étiquette est elle aussi sous le seuil.
   */
  const etiquetteAssociee = (element) => {
    const porteur =
      element.closest("label") ??
      (element.id
        ? document.querySelector(`label[for="${CSS.escape(element.id)}"]`)
        : null);
    if (!porteur) return null;
    const rect = porteur.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  };

  for (const element of tous) {
    if (!visible(element)) continue;

    // Un lien de texte dans un paragraphe n'est pas une cible tactile : sa
    // zone cliquable est le texte lui-même et le seuil 44 px ne s'applique
    // pas (WCAG 2.5.8, exception « inline »).
    if (
      !options.inclureLiensInline &&
      element.tagName === "A" &&
      element.matches(options.liensInline)
    ) {
      exclusionsLiensInline += 1;
      continue;
    }

    controleCount += 1;
    const rect = element.getBoundingClientRect();
    const width = Math.round(rect.width * 10) / 10;
    const height = Math.round(rect.height * 10) / 10;
    if (width >= seuil && height >= seuil) continue;

    const type = (element.getAttribute("type") ?? "").toLowerCase();
    const controleNatif =
      element.tagName === "INPUT" && (type === "checkbox" || type === "radio");
    if (controleNatif) {
      const etiquette = etiquetteAssociee(element);
      if (
        etiquette &&
        etiquette.width >= seuil &&
        etiquette.height >= seuil
      ) {
        exceptionsControlesNatifs += 1;
        continue;
      }
    }

    smallTargets.push({
      tag: element.tagName.toLowerCase(),
      role: element.getAttribute("role"),
      type: element.getAttribute("type"),
      name: element.getAttribute("name"),
      id: element.id || null,
      classe: (element.getAttribute("class") ?? "").slice(0, 120),
      libelleHtml: element.outerHTML.replace(/\s+/g, " ").slice(0, 160),
      text: libelle(element),
      width,
      height,
      seuilPx: seuil,
      manqueLargeurPx: Math.max(0, Math.round((seuil - width) * 10) / 10),
      manqueHauteurPx: Math.max(0, Math.round((seuil - height) * 10) / 10),
      cliquable: identifiant(element),
    });
  }

  smallTargets.sort(
    (a, b) => a.height + a.width - (b.height + b.width),
  );

  // Largeur de référence du débordement horizontal : celle du corps du
  // document, et non `documentElement.scrollWidth`. Mesuré le 2026-11-13 sur
  // /hote/rgpd : le tableau large (880 px) vit dans un conteneur
  // `overflow-x: auto`, la racine annonçait 724 px de débordement alors que le
  // corps restait à 320 px et que la page ne défilait pas horizontalement
  // (`scrollLeft` restait à 0, `contain: paint` sur le conteneur ramenait la
  // racine à 320 px). Un contenu réellement hors fenêtre élargit le corps :
  // c'est ce signal-là qui déclenche l'alerte, la racine restant publiée à
  // titre de comparaison.
  const largeurCorps = document.body
    ? document.body.scrollWidth
    : doc.scrollWidth;
  const largeurDebordante = Math.max(largeurCorps, doc.clientWidth);

  return {
    overflowPx: Math.max(0, largeurDebordante - doc.clientWidth),
    scrollWidth: largeurDebordante,
    scrollWidthRacine: doc.scrollWidth,
    clientWidth: doc.clientWidth,
    controleCount,
    smallTargets,
    exclusionsLiensInline,
    exceptionsControlesNatifs,
  };
}

/**
 * Lance la collecte sur une page Playwright déjà ouverte.
 *
 * @param {import("@playwright/test").Page} page
 * @param {{seuilPx?: number, inclureLiensInline?: boolean, controles?: string}} [options]
 */
export async function mesurerCiblesPage(page, options = {}) {
  const seuilPx = Number(options.seuilPx ?? 44);
  return page.evaluate(collecterCibles, {
    controles: options.controles ?? CONTROLES_SELECTEUR,
    seuilPx,
    liensInline: LIEN_INLINE_SELECTEUR,
    inclureLiensInline: Boolean(options.inclureLiensInline),
  });
}
