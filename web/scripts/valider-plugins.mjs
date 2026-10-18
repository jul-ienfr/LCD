#!/usr/bin/env node
// web/scripts/valider-plugins.mjs — CHARGEUR STRICT des manifestes plugins
// (§20.7 contrat + §F3 cahier 70). Refus + log, JAMAIS de demi-chargement.
// 0 dépendance : parseur YAML sous-ensemble plat écrit à la main (doctrine 0 €,
// §F0.4) — toute construction hors schéma = refus, fail-closed.
//
// Usage : node scripts/valider-plugins.mjs        (valid des 8 manifestes)
//         node scripts/valider-plugins.mjs --sync (miroir flags vs custom/)
// S'exécute aussi au `npm run build` (bloquant) et en CI. Si custom/logements.yaml
// est accessible (repo CI), le miroir des flags est synchronisé et vérifié.
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const RACINE = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIR_PLUGINS = join(RACINE, "src", "plugins");
const DIR_APP = join(RACINE, "src", "app");
const LOGEMENTS_YAML = join(RACINE, "..", "custom", "logements.yaml");

// Liste FERMÉE des 8 dashboards (§S3.2) — ajouter = +1 ligne ici + 1 dossier.
export const ID_CONNUS = new Set([
  "dash-super", "dash-admin", "dash-operateur", "dash-comptable",
  "dash-proprio", "dash-presta", "dash-voyageur", "dash-commercial",
]);
const LANGUES = ["fr", "en", "es", "it", "de"];
const VERBES = new Set(["GET", "POST"]);
// Clés requises du manifeste (§20.7) ; le reste est optionnel avec défaut.
const CLES_REQUISES = ["id", "version", "roles", "routes", "apis", "i18n_prefixe"];
const CLES_OPTIONNELLES = ["actif", "flags", "route_prefix", "lite", "offline"];
const CLES_AUTORISEES = new Set([...CLES_REQUISES, ...CLES_OPTIONNELLES]);

function lireJson(chemin) {
  return JSON.parse(readFileSync(chemin, "utf8"));
}

// --- Parseur YAML sous-ensemble PLAT (clés: valeur, listes inline [a, b]
// ET listes en bloc "- item"). Volontairement minimal : le manifeste est un
// contrat fermé, pas un fichier libre. Ancres, multi-doc, maps imbriquées,
// tabulations = refus explicite (fail-closed).
export function parserYamlManifeste(texte) {
  const obj = {};
  const erreurs = [];
  const lignes = texte.split(/\r?\n/);
  for (let i = 0; i < lignes.length; i++) {
    const ligneBrute = lignes[i];
    const sansCommentaire = ligneBrute.replace(/\s+#.*$/, "").trimEnd();
    if (!sansCommentaire.trim() || sansCommentaire.trimStart().startsWith("#"))
      continue;
    // Liste en bloc : "  - item" juste après une clé sans valeur → tableau.
    const blocItem = /^(\s+)-\s+(\S.*)$/.exec(sansCommentaire);
    if (blocItem) {
      const cle = cleEnAttente(obj);
      if (!cle) {
        erreurs.push(`item de liste sans cle mere : "${sansCommentaire.trim()}"`);
        continue;
      }
      obj[cle].push(blocItem[2].trim().replace(/^["']|["']$/g, ""));
      continue;
    }
    if (/^\s/.test(sansCommentaire)) {
      erreurs.push(`indentation refusee : "${ligneBrute.trim()}" (schema plat seul)`);
      continue;
    }
    const m = /^([a-z0-9_]+):\s*(.*)$/.exec(sansCommentaire);
    if (!m) {
      erreurs.push(`ligne illisible : "${ligneBrute.trim()}"`);
      continue;
    }
    const [, cle, reste] = m;
    if (cle in obj) {
      erreurs.push(`cle dupliquee : ${cle}`);
      continue;
    }
    if (reste.trim() === "") {
      // Clé ouvrante : les lignes suivantes indentées en "- item" la remplissent.
      obj[cle] = [];
      continue;
    }
    obj[cle] = decoderValeur(reste.trim(), cle, erreurs);
  }
  return { obj, erreurs };
}

// Dernière clé ouverte (liste en bloc en cours de lecture).
function cleEnAttente(obj) {
  const cles = Object.keys(obj);
  const derniere = cles[cles.length - 1];
  return derniere && Array.isArray(obj[derniere]) ? derniere : null;
}

function decoderValeur(brut, cle, erreurs) {
  if (brut === "") {
    erreurs.push(`cle "${cle}" sans valeur`);
    return "";
  }
  if (brut === "true") return true;
  if (brut === "false") return false;
  if (brut.startsWith("[") && brut.endsWith("]")) {
    const interieur = brut.slice(1, -1).trim();
    if (!interieur) return [];
    return interieur.split(",").map((t) => {
      const v = t.trim().replace(/^["']|["']$/g, "");
      if (!v) erreurs.push(`element vide dans la liste "${cle}"`);
      return v;
    });
  }
  if ((brut.startsWith('"') && brut.endsWith('"')) || (brut.startsWith("'") && brut.endsWith("'")))
    return brut.slice(1, -1);
  if (/[\[\]{}]|: /.test(brut)) {
    erreurs.push(`valeur complexe refusee sur "${cle}" : "${brut}"`);
    return brut;
  }
  return brut;
}

// --- Validation d'un manifeste (objet déjà parsé) ----------------------------
export function validerManifeste(obj, ctx) {
  const e = [...(ctx.erreursParse || [])];
  const rep = (m) => e.push(m);

  for (const cle of Object.keys(obj))
    if (!CLES_AUTORISEES.has(cle)) rep(`cle inconnue refusee : "${cle}" (schema ferme §20.7)`);
  for (const cle of CLES_REQUISES) if (!(cle in obj)) rep(`cle requise absente : ${cle}`);

  // id : connu + identique au nom du dossier (1 dossier = 1 plugin).
  if (typeof obj.id !== "string" || !ID_CONNUS.has(obj.id)) rep(`id inconnu : "${obj.id}"`);
  if (obj.id && ctx.dossier && obj.id !== ctx.dossier)
    rep(`id "${obj.id}" != nom du dossier "${ctx.dossier}"`);

  // version : semver simple.
  if (typeof obj.version !== "string" || !/^\d+\.\d+\.\d+$/.test(obj.version))
    rep(`version semver attendue : "${obj.version}"`);

  // actif : booléen ; défaut false (jamais de plugin actif par accident).
  if ("actif" in obj && typeof obj.actif !== "boolean") rep("actif doit etre true|false");
  const actif = obj.actif === true;

  // roles : non vide, ⊆ rôles connus (§S3.1, roles.json).
  const roles = ctx.rolesConnus;
  if (!Array.isArray(obj.roles) || obj.roles.length === 0) rep("roles : liste non vide requise");
  else for (const r of obj.roles) if (!roles.has(r)) rep(`role inconnu : "${r}"`);

  // routes : format /x, uniques dans le plugin ; si actif, la page existe.
  if (!Array.isArray(obj.routes) || obj.routes.length === 0) rep("routes : liste non vide requise");
  else {
    const vues = new Set();
    for (const r of obj.routes) {
      if (typeof r !== "string" || !r.startsWith("/") || (r.length > 1 && r.endsWith("/")))
        rep(`route mal formee : "${r}" (/x, sans slash final)`);
      if (vues.has(r)) rep(`route dupliquee : "${r}"`);
      vues.add(r);
      if (actif && !ctx.routeExiste(r, ctx.dossier))
        rep(`route "${r}" sans page (src/app${r === "/" ? "" : r}/page.tsx ou ${ctx.dossier}${r}/page.tsx)`);
    }
  }

  // apis : "VERB /chemin" — sous-ensemble de l'allowlist globale JAMAIS élargi
  // (§20.7). Un chemin finissant par "/" = préfixe, doit être une entrée de
  // l'allowlist des préfixes.
  if (!Array.isArray(obj.apis) || obj.apis.length === 0) rep("apis : liste non vide requise");
  else
    for (const api of obj.apis) {
      const m = /^([A-Z]+) (\/\S*)$/.exec(String(api));
      if (!m) {
        rep(`api mal formee : "${api}" (VERB /chemin)`);
        continue;
      }
      const [, verbe, chemin] = m;
      if (!VERBES.has(verbe)) rep(`verbe refuse : "${verbe}" (GET|POST seul)`);
      const autorisees = verbe === "GET" ? ctx.allow.lecture : ctx.allow.ecriture;
      if (chemin.endsWith("/")) {
        if (!ctx.allow.prefixes.includes(chemin))
          rep(`prefixe hors allowlist : "${chemin}"`);
      } else if (!autorisees.has(chemin)) rep(`hors allowlist ${verbe} : "${chemin}"`);
    }

  // flags : ⊆ features connues (flags.json, miroir logements.yaml).
  if ("flags" in obj) {
    if (!Array.isArray(obj.flags)) rep("flags doit etre une liste");
    else for (const f of obj.flags) if (!ctx.flagsConnus.has(f)) rep(`flag inconnu : "${f}"`);
  }

  // i18n_prefixe : non vide, se termine par "." (namespacing par plugin).
  if (typeof obj.i18n_prefixe !== "string" || !obj.i18n_prefixe.endsWith("."))
    rep(`i18n_prefixe doit finir par "." : "${obj.i18n_prefixe}"`);

  // Clés optionnelles typées.
  if ("route_prefix" in obj && (typeof obj.route_prefix !== "string" || !obj.route_prefix.startsWith("/")))
    rep(`route_prefix doit commencer par "/" : "${obj.route_prefix}"`);
  for (const b of ["lite", "offline"])
    if (b in obj && typeof obj[b] !== "boolean") rep(`${b} doit etre true|false`);

  // i18n.json du plugin : 5 langues présentes et non vides (§S3.4.2).
  if (ctx.i18nFichier) {
    const brut = lireJson(ctx.i18nFichier);
    for (const l of LANGUES) {
      const d = brut[l];
      if (!d || typeof d !== "object" || Array.isArray(d) || Object.keys(d).length === 0)
        rep(`i18n.json : langue "${l}" absente ou vide (5/5 requises)`);
    }
    for (const l of Object.keys(brut))
      if (!LANGUES.includes(l)) rep(`i18n.json : langue inconnue "${l}"`);
  } else if (actif) {
    rep("i18n.json absent pour un plugin actif");
  }

  return { erreurs: e, actif };
}

// --- Parcours du dossier plugins + sync flags -------------------------------
export function validerTout(racine = DIR_PLUGINS) {
  const rolesConnus = new Set(lireJson(join(racine, "roles.json")).roles);
  const flagsConnus = new Set(lireJson(join(racine, "flags.json")).flags);
  const allowBrut = lireJson(join(RACINE, "src", "lib", "allowlist.json"));
  const ctx0 = {
    rolesConnus,
    flagsConnus,
    allow: {
      lecture: new Set(allowBrut.lecture),
      ecriture: new Set(allowBrut.ecriture),
      prefixes: allowBrut.prefixes,
    },
    routeExiste: (route, dossier) =>
      existsSync(join(DIR_APP, route === "/" ? "page.tsx" : route.slice(1), "page.tsx")) ||
      existsSync(join(racine, dossier, route === "/" ? "page.tsx" : route.slice(1), "page.tsx")),
  };

  const dossiers = readdirSync(racine, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name.startsWith("dash-"))
    .map((d) => d.name)
    .sort();

  const resultats = [];
  const routesVues = new Map(); // route → dossier (1 route = 1 plugin actif)
  for (const dossier of dossiers) {
    const man = join(racine, dossier, "dashboard.yaml");
    if (!existsSync(man)) {
      resultats.push({ dossier, erreurs: ["dashboard.yaml absent"] });
      continue;
    }
    const { obj, erreurs } = parserYamlManifeste(readFileSync(man, "utf8"));
    const i18nFichier = join(racine, dossier, "i18n.json");
    const v = validerManifeste(obj, {
      ...ctx0,
      dossier,
      erreursParse: erreurs,
      i18nFichier: existsSync(i18nFichier) ? i18nFichier : null,
    });
    if (obj.actif === true && Array.isArray(obj.routes))
      for (const r of obj.routes) {
        const proprio = routesVues.get(r);
        if (proprio && proprio !== dossier)
          v.erreurs.push(`route "${r}" revendiquee par ${proprio} ET ${dossier} (1 route = 1 plugin)`);
        else routesVues.set(r, dossier);
      }
    resultats.push({ dossier, actif: v.actif, erreurs: v.erreurs });
  }
  return resultats;
}

// Miroir flags : logements.yaml (union features) ⊆ flags.json ⊆ logements ∪ kill-switch.
export function synchroniserFlags() {
  if (!existsSync(LOGEMENTS_YAML)) return null; // image Docker : skip + NOTE
  const texte = readFileSync(LOGEMENTS_YAML, "utf8");
  const features = new Set();
  let indentFeatures = -1; // indent du bloc `features:` ; -1 = hors bloc
  for (const ligneBrute of texte.split(/\r?\n/)) {
    const ligne = ligneBrute.replace(/\s+#.*$/, "").trimEnd(); // commentaires stripés AVANT tout match
    const mFeature = /^(\s*)features:\s*$/.exec(ligne);
    if (mFeature) {
      indentFeatures = mFeature[1].length;
      continue;
    }
    if (indentFeatures < 0) continue;
    if (!ligne.trim()) continue;
    const indent = ligne.length - ligne.trimStart().length;
    if (indent <= indentFeatures) {
      indentFeatures = -1; // clé sœur/parente = fin du bloc features
      continue;
    }
    const mCle = /^\s+([a-z0-9_]+):\s*(true|false)\s*$/.exec(ligne);
    if (mCle) features.add(mCle[1]);
  }
  const miroir = new Set(lireJson(join(DIR_PLUGINS, "flags.json")).flags);
  const erreurs = [];
  for (const f of features)
    if (!miroir.has(f)) erreurs.push(`flags.json manque la feature logements.yaml : "${f}"`);
  for (const f of miroir)
    if (!features.has(f) && f !== "jev_enabled")
      erreurs.push(`flags.json porte un flag absent de logements.yaml : "${f}"`);
  return { features, erreurs };
}

// --- CLI ----------------------------------------------------------------------
const estPrincipal = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1].replace(/\\/g, "/") ||
  process.argv[1]?.endsWith("valider-plugins.mjs");
if (estPrincipal) {
  let ko = 0;
  const resultats = validerTout();
  for (const r of resultats) {
    if (r.erreurs.length === 0) {
      console.log(`[OK] ${r.dossier} (${r.actif ? "actif" : "inactif"})`);
    } else {
      for (const e of r.erreurs) console.log(`[KO] ${r.dossier} : ${e}`);
      ko += r.erreurs.length;
    }
  }
  const sync = synchroniserFlags();
  if (sync === null) console.log("NOTE custom/logements.yaml inaccessible : miroir flags non verifie.");
  else if (sync.erreurs.length === 0) console.log(`[OK] miroir flags = logements.yaml (${sync.features.size} features)`);
  else {
    for (const e of sync.erreurs) console.log(`[KO] flags : ${e}`);
    ko += sync.erreurs.length;
  }
  console.log(ko === 0 ? `RESULTAT : plugins OK (${resultats.length}/8 valides)` : `RESULTAT : ${ko} ECHEC(S)`);
  process.exit(ko === 0 ? 0 : 1);
}
