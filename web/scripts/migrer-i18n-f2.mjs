// web/scripts/migrer-i18n-f2.mjs — ONE-SHOT (F2) : extrait de src/lib/i18n.ts
// les clés EXCLUSIVES de chaque dashboard vers son i18n.json préfixé, régénère
// i18n.ts sans elles, et écrit le wrapper plugin i18n.ts. Puis se supprime ?
// Non : conservé pour audit (changelog trace la migration ; R6).
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const LANGUES = ["fr", "en", "es", "it", "de"];

// Clés exclusives par plugin (établies par scan d'usage : chaque clé ci-dessous
// n'est appelée que par les pages de CE plugin ; les clés partagées restent cœur).
const PAR_PLUGIN = {
  "dash-operateur": ["operateur.", [
    "actions_1tap", "alertes", "aujourd_hui", "conflits", "copro", "ecritures_off",
    "ha_morte", "ha_vivante", "joignables", "kpi_ecritures", "kpi_fanout",
    "kpi_journal", "kpi_logements", "kpi_occupation", "kpi_refus", "kpi_routage",
    "kpi_todos", "non_bloquee", "operation", "oui", "planning", "planning_h1",
    "prix_7j", "th_dossier", "th_echeance", "th_statut", "titre",
  ]],
  "dash-voyageur": ["voyageur.", [
    "extras_commander", "extras_sous", "extras_titre", "guide_arrivee",
    "guide_depart", "guide_equipements", "guide_nuits", "guide_sejour",
    "guide_vide", "incident_declarer", "incident_sous", "incident_titre",
    "par_nuit", "prix_consulter", "voyageur_bienvenue",
  ]],
  "dash-proprio": ["proprio.", [
    "lecture_seule", "releve_brut", "releve_canaux", "releve_charges",
    "releve_commission", "releve_detail", "releve_net", "releve_nuits",
    "releve_titre",
  ]],
  "dash-commercial": ["commercial.", [
    "pipeline_prospects", "pipeline_titre", "prospect_sous", "prospect_titre",
    "simulateur_sous", "simulateur_titre",
  ]],
  "dash-comptable": ["comptable.", ["compta_h1"]],
  "dash-presta": ["presta.", ["prestation"]],
};

const src = readFileSync(join(RACINE, "src", "lib", "i18n.ts"), "utf8");

// 1. Parse tous les blocs `key: { fr: "...", ... }` (multi OU mono ligne).
const blocs = new Map(); // cle -> { texte, valeurs }
for (const m of src.matchAll(/([a-z0-9_]+):\s*\{([^{}]*)\}/g)) {
  const cle = m[1];
  const valeurs = {};
  for (const lm of m[2].matchAll(/(fr|en|es|it|de):\s*"((?:[^"\\]|\\.)*)"/g))
    valeurs[lm[1]] = lm[2];
  if (LANGUES.every((l) => valeurs[l] !== undefined)) blocs.set(cle, { texte: m[0], valeurs });
}

// 2. Vérifie que chaque clé migrande existe et est complète.
let erreur = 0;
for (const [plugin, [prefixe, cles]] of Object.entries(PAR_PLUGIN)) {
  for (const c of cles) {
    if (!blocs.has(c)) { console.log(`[KO] cle absente de i18n.ts : ${c} (${plugin})`); erreur++; }
    else if (blocs.get(c).texte.length === 0) { console.log(`[KO] bloc vide : ${c}`); erreur++; }
    if (!prefixe.endsWith(".")) { console.log(`[KO] prefixe sans point : ${prefixe}`); erreur++; }
  }
}
if (erreur) { console.log(`RESULTAT : ${erreur} ECHEC(S) — rien ecrit.`); process.exit(1); }

// 3. Écrit chaque i18n.json préfixé (shape clé -> 5 langues, comme le cœur).
for (const [plugin, [prefixe, cles]] of Object.entries(PAR_PLUGIN)) {
  const dict = {};
  for (const c of cles) dict[`${prefixe}${c}`] = blocs.get(c).valeurs;
  writeFileSync(
    join(RACINE, "src", "plugins", plugin, "i18n.json"),
    JSON.stringify(dict, null, 2) + "\n",
    "utf8",
  );
  console.log(`[OK] ${plugin}/i18n.json : ${cles.length} cles prefixees "${prefixe}"`);
}

// 4. Régénère i18n.ts SANS les blocs migrés (suppression exacte du texte source).
let reste = src;
const migrees = new Set(Object.values(PAR_PLUGIN).flatMap(([, cles]) => cles));
for (const c of migrees) {
  const b = blocs.get(c);
  // Supprime le bloc + la virgule éventuelle + la fin de ligne.
  reste = reste.replace(new RegExp(`\\n  ${c}:\\s*\\{[^{}]*\\},`), "");
}
if (reste.split("\n").length > src.split("\n").length - migrees.size * 6) {
  console.log("[KO] suppression i18n.ts anormale (compter de lignes) — rien ecrit.");
  process.exit(1);
}
writeFileSync(join(RACINE, "src", "lib", "i18n.ts"), reste, "utf8");
console.log(`[OK] i18n.ts : ${migrees.size} cles migrees, reste ${reste.match(/^  [a-z0-9_]+: \{$/gm)?.length ?? "?"} cles cœur`);

// 5. Écrit le wrapper i18n.ts de chaque plugin (dict local + repli cœur).
for (const [plugin, [prefixe]] of Object.entries(PAR_PLUGIN)) {
  const nom = prefixe.slice(0, -1); // "operateur"
  writeFileSync(
    join(RACINE, "src", "plugins", plugin, "i18n.ts"),
    `// plugins/${plugin}/i18n.ts — dictionnaire du plugin (i18n préfixée §F3).
// Les clés sont toutes prefixées "${prefixe}" (contrôle : le chargeur refuse
// toute clé hors préfixe). Repli sur le dictionnaire CŒUR pour les clés
// partagées (envoyer, qui, choisir_logement...) — DRY : une clé = un seul
// endroit, le cœur garde le vocabulaire commun.
import { t as tCoeur, type Langue } from "@/lib/i18n";
import dict from "./i18n.json";

const DICT = dict as Record<string, Record<Langue, string>>;

export function t(cle: string, lang: Langue): string {
  return DICT[cle]?.[lang] ?? tCoeur(cle, lang);
}

export const CLE_PREFIXE = "${prefixe}" as const;
`,
    "utf8",
  );
  console.log(`[OK] ${plugin}/i18n.ts (wrapper)`);
}
console.log("RESULTAT : migration i18n F2 terminee.");
