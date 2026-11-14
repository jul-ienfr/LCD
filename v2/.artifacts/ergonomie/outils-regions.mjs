/**
 * Rend les zones à défilement horizontal accessibles au clavier
 * (`scrollable-region-focusable`, axe serious) : ajoute `role="region"`,
 * `tabindex="0"` et un nom accessible, plus le `svelte-ignore` correspondant.
 *
 * Idempotent : les balises qui portent déjà `tabindex` sont laissées telles
 * quelles. Écrit en Node (pas en PowerShell) pour éviter les pièges de
 * remplacement ligne à ligne.
 *
 * Usage : node .artifacts/ergonomie/outils-regions.mjs
 */
import { readFile, writeFile } from "node:fs/promises";

const IGNORE = "<!-- svelte-ignore a11y_no_noninteractive_tabindex -->";

const plan = [
  {
    fichier: "src/routes/hote/police/+page.svelte",
    avant: '<div class="mt-4 overflow-x-auto">',
    apres:
      '<div role="region" tabindex="0" aria-label="Tableau défilant" class="mt-4 overflow-x-auto">',
  },
  {
    fichier: "src/routes/hote/sinistres/+page.svelte",
    avant:
      '<div class="ui-carte--plate overflow-x-auto rounded-2xl border border-bordure bg-surface">',
    apres:
      '<div role="region" tabindex="0" aria-label="Tableau défilant" class="ui-carte--plate overflow-x-auto rounded-2xl border border-bordure bg-surface">',
  },
  {
    fichier: "src/routes/hote/+page.svelte",
    avant: '<div class="hidden overflow-x-auto md:block">',
    apres:
      '<div role="region" tabindex="0" aria-label="Tableau défilant" class="hidden overflow-x-auto md:block">',
    tous: true,
  },
  {
    fichier: "src/routes/developpeurs/+page.svelte",
    avant: '<pre class="overflow-x-auto rounded-xl bg-surface-2 p-4 text-sm">',
    apres:
      '<pre role="region" tabindex="0" aria-label="Exemple de code" class="overflow-x-auto rounded-xl bg-surface-2 p-4 text-sm">',
    tous: true,
  },
  {
    fichier: "src/routes/developpeurs/+page.svelte",
    avant: '<div class="overflow-x-auto rounded-2xl border border-bordure">',
    apres:
      '<div role="region" tabindex="0" aria-label="Tableau défilant" class="overflow-x-auto rounded-2xl border border-bordure">',
    tous: true,
  },
  {
    fichier: "src/routes/hote/import/+page.svelte",
    avant: '<pre class="overflow-x-auto rounded-xl bg-surface-2 p-3 text-xs">',
    apres:
      '<pre role="region" tabindex="0" aria-label="Exemple de fichier CSV" class="overflow-x-auto rounded-xl bg-surface-2 p-3 text-xs">',
    tous: true,
  },
  {
    fichier: "src/routes/hote/audit/+page.svelte",
    avant: '<pre class="mt-2 overflow-x-auto rounded-controle bg-fond p-3">',
    apres:
      '<pre role="region" tabindex="0" aria-label="Détail technique" class="mt-2 overflow-x-auto rounded-controle bg-fond p-3">',
  },
  {
    fichier: "src/routes/journal/+page.svelte",
    avant:
      '<div class="overflow-x-auto rounded-2xl border border-bordure bg-surface">',
    apres:
      '<div role="region" tabindex="0" aria-label="Tableau défilant" class="overflow-x-auto rounded-2xl border border-bordure bg-surface">',
  },
  {
    fichier: "src/routes/journal/+page.svelte",
    avant:
      '<pre class="mt-2 max-w-md overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-fond p-2">',
    apres:
      '<pre role="region" tabindex="0" aria-label="Charge utile" class="mt-2 max-w-md overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-fond p-2">',
  },
];

const parFichier = new Map();
for (const entree of plan) {
  if (!parFichier.has(entree.fichier)) parFichier.set(entree.fichier, []);
  parFichier.get(entree.fichier).push(entree);
}

let total = 0;
for (const [fichier, entrees] of parFichier) {
  const source = await readFile(fichier, "utf8");
  const lignes = source.split("\n");
  const sortie = [];
  for (const ligne of lignes) {
    const net = ligne.trimStart();
    const entree = entrees.find((e) => net.startsWith(e.avant));
    if (!entree || net.includes("tabindex")) {
      sortie.push(ligne);
      continue;
    }
    const indent = ligne.slice(0, ligne.length - net.length);
    sortie.push(indent + IGNORE);
    sortie.push(indent + net.replace(entree.avant, entree.apres));
    total++;
  }
  await writeFile(fichier, sortie.join("\n"), "utf8");
  console.log(`modifié : ${fichier}`);
}
console.log(`zones rendues focusables : ${total}`);