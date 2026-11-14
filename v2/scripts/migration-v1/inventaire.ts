/**
 * Inventaire V1 en lecture seule (spec 005, US3 — T100, T101, T104).
 *
 * Usage :
 *   npm run migration:inventaire
 *   tsx scripts/migration-v1/inventaire.ts --sortie ../docs/ops/migration-2026-11
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { chargerSources } from "./sources";

interface Options {
  sources: string;
  sortie: string;
}

function lireOptions(argv: string[]): Options {
  const valeur = (nom: string, defaut: string): string => {
    const index = argv.indexOf(nom);
    if (index >= 0 && argv[index + 1]) return argv[index + 1] as string;
    return defaut;
  };
  return {
    sources: resolve(valeur("--sources", "../custom")),
    sortie: resolve(valeur("--sortie", "../docs/ops/migration-2026-11")),
  };
}

function aujourdhui(): string {
  const d = new Date();
  const deux = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
}

function main(): void {
  const options = lireOptions(process.argv.slice(2));
  const chargement = chargerSources(options.sources);
  const date = aujourdhui();
  const totalOctets = chargement.fichiers
    .filter((f) => f.present && f.octets !== null)
    .reduce((somme, f) => somme + (f.octets ?? 0), 0);
  const totalEnregistrements = chargement.fichiers
    .filter((f) => f.role === "source" && f.volume !== null)
    .reduce((somme, f) => somme + (f.volume ?? 0), 0);

  const inventaire = {
    genereLe: new Date().toISOString(),
    racine: chargement.racine,
    totalOctets,
    totalEnregistrements,
    fichiers: chargement.fichiers,
    sources: chargement.sources,
  };

  mkdirSync(options.sortie, { recursive: true });
  writeFileSync(
    join(options.sortie, "inventaire-v1.json"),
    `${JSON.stringify(inventaire, null, 2)}\n`,
    "utf8",
  );

  const lignes: string[] = [
    "# Inventaire des sources V1",
    "",
    "```text",
    "Statut : ACTIF",
    "Propriétaire : exploitation",
    `Dernière vérification : ${date}`,
    "Remplace / remplacé par : —",
    "Source de vérité : specs/005-mise-en-production/spec.md (US3)",
    "```",
    "",
    `- **Date de l'inventaire** : ${date}`,
    `- **Racine inspectée** : \`${chargement.racine}\``,
    `- **Volume total** : ${totalOctets} octets, ${totalEnregistrements} enregistrements`,
    "- **Mode** : lecture seule, SHA-256 avant/après, secrets jamais ouverts",
    "- **Script** : `v2/scripts/migration-v1/inventaire.ts`",
    "",
    "## Sources métier",
    "",
    "| Fichier | Présent | Octets | Volume | SHA-256 (12) | Sensibilité | Devenir |",
    "| --- | --- | ---: | ---: | --- | --- | --- |",
    ...chargement.fichiers
      .filter((f) => f.role === "source")
      .map(
        (f) =>
          `| \`${f.chemin}\` | ${f.present ? "oui" : "non"} | ${f.octets ?? "—"} | ${f.volume ?? "—"} | ${f.sha256 ? f.sha256.slice(0, 12) : "—"} | ${f.sensibilite} | ${f.devenir} |`,
      ),
    "",
    "## Fichiers exclus d'office",
    "",
    "| Fichier | Présent | Sensibilité | Motif |",
    "| --- | --- | --- | --- |",
    ...chargement.fichiers
      .filter((f) => f.role !== "source")
      .map(
        (f) =>
          `| \`${f.chemin}\` | ${f.present ? "oui" : "non"} | ${f.sensibilite} | ${f.note ?? f.devenir} |`,
      ),
    "",
    "## Constat",
    "",
    "La V1 est essentiellement déclarative : les volumes métier sont faibles et",
    "les fichiers de secrets, d'état runtime et d'infrastructure restent hors",
    "périmètre. Aucun contenu de ces fichiers n'a été lu.",
    "",
  ];

  writeFileSync(
    join(options.sortie, "inventaire-v1.md"),
    `${lignes.join("\n")}\n`,
    "utf8",
  );

  console.log(
    `Inventaire écrit : ${join(options.sortie, "inventaire-v1.json")} (${chargement.fichiers.filter((f) => f.present).length} fichiers présents, ${totalEnregistrements} enregistrements)`,
  );
}

main();
