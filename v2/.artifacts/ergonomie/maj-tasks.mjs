/**
 * T106/T112 — met à jour `specs/004-ergonomie-experience-client/tasks.md` :
 * coche les tâches dont la preuve existe et annote celles qui restent
 * ouvertes. Idempotent : relancer ne double pas les annotations.
 */
import { readFileSync, writeFileSync } from "node:fs";

const CHEMIN = "../specs/004-ergonomie-experience-client/tasks.md";
const texte = readFileSync(CHEMIN, "utf8");
const lignes = texte.split("\n");

const PRIMITIVES =
  " — brique présente dans `src/lib/components/ui/`, couverte par `tests/ergonomie/{primitives,vitrine-primitives,voyageur-primitives}.test.ts`";

/** id -> annotation ajoutée (et case cochée) */
const FAITES = {
  T017: PRIMITIVES,
  T018: PRIMITIVES,
  T019: PRIMITIVES,
  T020: PRIMITIVES,
  T021: PRIMITIVES,
  T022: PRIMITIVES,
  T023: PRIMITIVES,
  T024: PRIMITIVES,
  T031: " — `scripts/audit-a11y.mjs` (axe) et `scripts/mesurer-cibles.mjs` (320 px + 44 px)",
  T032: " — `scripts/audit-ergonomie.mjs` (+ `scripts/lib/mesure-cibles.mjs`) agrège baseline/après",
  T033: " — `/design` documente les primitives, `e2e/design.spec.ts` les vérifie",
  T034: " — accueil restructuré (promesse, preuves, CTA unique) et SEO serveur : canonical, `hreflang`, JSON-LD",
  T035: " — `src/lib/components/ui/selecteur-langue.svelte` + `tests/ergonomie/i18n-vitrine.test.ts`",
  T036: " — `entete-publique.svelte` plafonne les entrées, porte la langue et un accès propriétaire discret",
  T037: " — `indicateur-etapes.svelte` : deux étapes explicites, formulaires natifs conservés",
  T038: " — `min={data.dateMin}` sur arrivée/départ et `champ-erreur.svelte` en ligne",
  T039: " — `resume-prix.svelte` (nuits, total, inclusions)",
  T040: " — récapitulatif `lg:sticky` et `barre-action-mobile.svelte`",
  T041: " — `fail(400, { valeurs, erreurs })` : valeurs saisies renvoyées telles quelles",
  T042: " — `src/lib/i18n/public/aide.ts` + `tests/ergonomie/i18n-aide.test.ts`",
  T043: " — canonical, `hreflang` (+ `x-default`) et JSON-LD sur les routes publiques",
  T044: " — `e2e/ergonomie-reservation.spec.ts` (JS et sans JS)",
  T046: " — voir T109 : `frictions.md` § « T109 — frictions traitées et re-testées »",
  T058: " — traité avec T109 (`frictions.md`) ; reste la recette humaine de T057",
  T062: " — `section[aria-labelledby=\"a-faire-maintenant\"]` avant les KPI, ≤ 5 actions triées",
  T063: " — badges urgences/impayés (danger), retards (alerte), messages (accent)",
  T065: " — cartes sous `md` et test e2e « T065 » dans `e2e/ergonomie-staff.spec.ts`",
  T066: " — champ + `champ-erreur.svelte` + `ui-alerte` liés par `aria-describedby` (test e2e « T066 »)",
  T067: " — `tests/ergonomie/navigation.test.ts` + test e2e « le menu Plus ne contient que des liens de l'espace staff »",
  T068: " — `e2e/ergonomie-staff.spec.ts` (navigation, recherche, fil d'Ariane, `aria-current`)",
  T069: " — `e2e/accessibilite-staff.spec.ts` (clavier, focus, `aria-current`, sortie de menu)",
  T080: " — `tests/ergonomie/theme.test.ts` (`verifierTousLesThemes`, six thèmes clair/sombre) et `.artifacts/ergonomie/contrastes.json`",
  T082: " — `/design` et `tests/ergonomie/theme.test.ts` (voir T100/T102)",
  T083: " — inclusions, taxe et délai affichés dans le tunnel ; vérifié par `e2e/confiance.spec.ts`",
  T084: " — confirmation : référence, récapitulatif, contact, prochaine étape (`e2e/confiance.spec.ts`)",
  T085: " — symétrie vérifiée : refus du suivi aussi simple que l'acceptation (`e2e/confiance.spec.ts`)",
  T086: " — `t.reessayer`, `t.revenirDates`, `t.contacterHote` : chaque erreur propose une sortie",
  T087: " — aucune case marketing, aucune urgence inventée : assertions dans `e2e/confiance.spec.ts`",
  T088: " — `e2e/confiance.spec.ts` (js + sans-js)",
  T089:
    " — `reserver/+page.server.ts` : `etape_vue` (`accueil`/`dates`/`prix`/`confirmation`), `erreur_formulaire` (coordonnées, résultat `erreur`) et `parcours_reussi` (étape `demande`, résultat `succes`)",
  T104:
    " — `npm run typecheck` 0 erreur / 0 avertissement ; `npm test` 256 fichiers, 1 587 réussis, 2 ignorés ; `npm run db:check` « Everything's fine » ; `npm run build` voir § 2.1 de `resultats.md`",
  T105:
    " — suite complète rejouée sur serveur provisionné (`ENQUIRY_ENABLED=true`, port 4174) : voir § 2.1 de `resultats.md`",
  T106:
    " — `apres-axe.json`, `apres-axe-staff.json`, `apres-320.json`, `apres-320-staff.json`, `apres-js.json` et `baseline/rapport-agrege.md` régénéré",
  T108: " — § 1 de `resultats.md` (tableau avant/après)",
  T109: " — `frictions.md` § « T109 — frictions traitées et re-testées » et § frictions de recette (R-01 à R-05)",
  T111:
    " — `v2/ECARTS-V1.md`, `v2/TESTS-A-FAIRE.md`, `docs/registres/changelog.md`, `docs/registres/etat-reel.md`",
  T112: " — § 3 de `resultats.md` (décisions A1 à A14)",
};

/** id -> annotation ajoutée sans cocher (reste ouvert, avec l'état réel) */
const OUVERTES = {
  T045:
    " — **partiellement couvert** : 320 px, sans JS et clavier sont testés automatiquement (`ergonomie-reservation.spec.ts`, `confiance.spec.ts`) ; le test utilisateur de 5 personnes reste à faire",
  T057:
    " — **partiellement couvert** : 320 px et mode hors ligne testés (`ergonomie-voyageur.spec.ts`) ; lecteur d'écran et téléphone réel restent à faire",
  T076:
    " — **partiellement couvert** : recette clavier automatisée (`accessibilite-staff.spec.ts`, `ergonomie-*.spec.ts`) ; pièges de focus en situation réelle à confirmer",
  T077: " — **bloqué** : lecteur d'écran (NVDA/VoiceOver) non automatisable ici ; recette humaine requise",
  T078: " — **bloqué** : zoom 200 %, contraste élevé et `prefers-reduced-motion` à valider par recette humaine",
  T081:
    " — **bloqué pour la mesure** : Lighthouse absent (politique « ne pas installer ») ; les illustrations publiques portent `width`/`height` et les logos `h-8 w-auto` réservent leur espace en CSS, mais aucune mesure LCP/CLS n'est disponible pour trancher",
  T103: " — **bloqué** : recette super-admin humaine (brouillon, aperçu, blocage, correction, publication)",
  T107: " — **bloqué** : deuxième round de test utilisateur (5 personnes) requiert des participants",
  T110: " — **bloqué** : déploiement production non autorisé depuis cette session (gel V1/V2 locale)",
};

let cochees = 0;
let annotees = 0;
const inconnues = [];

for (let i = 0; i < lignes.length; i += 1) {
  const m = lignes[i].match(/^- \[([ x])\] (T\d{3})\b/);
  if (!m) continue;
  const [, case_, id] = m;
  if (FAITES[id]) {
    if (!lignes[i].includes(FAITES[id])) {
      lignes[i] = lignes[i].replace("- [ ] ", "- [x] ") + FAITES[id];
      annotees += 1;
    }
    if (case_ === " ") cochees += 1;
  } else if (OUVERTES[id]) {
    if (!lignes[i].includes(OUVERTES[id])) {
      lignes[i] = `${lignes[i].replace(/ — \*\*bloqué.*$/, "")}${OUVERTES[id]}`;
      annotees += 1;
    }
  }
}

const restantes = lignes.filter((l) => /^- \[ \] T\d{3}/.test(l)).length;
writeFileSync(CHEMIN, lignes.join("\n"), "utf8");
console.log(
  `tâches cochées : ${cochees}, annotations ajoutées : ${annotees}, tâches encore ouvertes : ${restantes}`,
);
for (const id of [...Object.keys(FAITES), ...Object.keys(OUVERTES)]) {
  if (!lignes.some((l) => l.includes(id))) inconnues.push(id);
}
if (inconnues.length > 0) console.log("ids introuvables :", inconnues.join(", "));
