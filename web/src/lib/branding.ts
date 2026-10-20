// lib/branding.ts — UNE source de vérité pour la marque côté client-visible
// (cahier 70 §F0.6 / socle §S3.4.3 : marque blanche, 0 fuite « LCD »).
//
// Règle normative §S3.4.3 : « changer branding → re-thème SANS CODE ».
// La marque se lit donc côté serveur depuis l'env (comme LCD_GATEWAY_URL
// dans lib/gateway.ts) — JAMAIS figée dans le build. Le service worker
// précache le HTML (sw.js), une constante de build laisserait donc la
// marque du client précédent sur les appareils déjà installés.
//
// Degré de fraîcheur, dit sans surclaim : le composant JSX (en-tête,
// pied, pages) est `instant = false` → résolu À CHAQUE requête, et
// manifest.ts appelle `connection()` → pareil (sinon Next le prerend au
// build et l'icône d'accueil garde la marque d'avant). L'objet
// `metadata` du layout est du code de module → résolu au DÉMARRAGE du
// process. Dans les 3 cas : changer l'env + redémarrer le conteneur
// re-thème, 0 touche au code, 0 rebuild. Le SW, de toute façon, ne
// reverra la page qu'au prochain passage réseau (purge « lcd-purge »).
//
// Lab : LCD_MARQUE non défini → repli neutre « Séjour ». Aucune fuite LCD
// n'est tolérée même en lab, sinon la batterie (deploy/test-front.ps1
// §14) mesurerait le repli et non la fuite réelle.
//
// Portée : uniquement ce qui part vers le CLIENT (titre, en-tête, manifeste,
// ICS, exports). Les cookies (lcd_*) et en-têtes ICS X-LCD-* restent en dur :
// ce sont des identifiants internes de protocole, jamais rendus.

/** Marque affichable, lue à chaque requête. */
export function marque(): string {
  return process.env.LCD_MARQUE?.trim() || "Séjour";
}

/** Nom court (manifeste PWA, onglet, icône). */
export function marqueCourte(): string {
  return process.env.LCD_MARQUE_COURTE?.trim() || marque();
}

/**
 * Variantes à usage fichier (exports CSV/ICS) : ASCII strict (cp1252/§F1),
 * sans espace — un nom de fichier ne porte jamais d'accent ni de guillemet.
 */
export function slugMarque(): string {
  const brut = process.env.LCD_MARQUE_SLUG?.trim();
  if (brut) return brut;
  return marque()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase() || "sejour";
}
