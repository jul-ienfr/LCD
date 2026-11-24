#!/usr/bin/env node
/**
 * Vérifie qu'une copie hors-site de la sauvegarde existe et est récente
 * (spec 006, FR-006).
 *
 * Les sauvegardes sont produites par `.github/workflows/v2-backup.yml` et
 * publiées comme artefacts GitHub : GitHub est l'hébergement hors du serveur
 * surveillé. Ce script interroge l'API des artefacts et échoue si la plus
 * récente copie dépasse l'âge maximal (26 h : 24 h de RPO + marge).
 *
 * Usage :
 *   GITHUB_REPOSITORY=owner/repo GITHUB_TOKEN=... node scripts/verifier-sauvegarde-externe.mjs
 * Variables : AGE_MAX_HEURES (défaut 26), PREUVE (fichier JSON de sortie).
 */
import { writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

export const PREFIXE_ARTEFACT = "lcd-backup-";

/**
 * Plus vieil âge acceptable, en heures, de la copie hors-site.
 * Pur et testable : aucune dépendance réseau.
 */
export function artefactsSauvegarde(artefacts) {
  return (artefacts ?? []).filter(
    (artefact) => typeof artefact?.name === "string" && artefact.name.startsWith(PREFIXE_ARTEFACT),
  );
}

/**
 * Dernière copie hors-site et son âge. `maintenant` injecté pour les tests.
 * Renvoie `{ present, ageHeures, nom, expireLe }`.
 */
export function etatCopieHorsSite(artefacts, maintenant, ageMaxHeures = 26) {
  const copies = artefactsSauvegarde(artefacts)
    .map((artefact) => ({
      nom: artefact.name,
      creeLe: Date.parse(artefact.created_at ?? ""),
      expireLe: artefact.expires_at ?? null,
    }))
    .filter((copie) => Number.isFinite(copie.creeLe));

  if (copies.length === 0) {
    return { present: false, ageHeures: null, nom: null, expireLe: null, conforme: false };
  }

  copies.sort((a, b) => b.creeLe - a.creeLe);
  const derniere = copies[0];
  const ageHeures = (maintenant.getTime() - derniere.creeLe) / 3_600_000;
  return {
    present: true,
    ageHeures: Math.round(ageHeures * 10) / 10,
    nom: derniere.nom,
    expireLe: derniere.expireLe,
    conforme: ageHeures <= ageMaxHeures,
  };
}

async function principal() {
  const depot = process.env.GITHUB_REPOSITORY ?? "";
  const jeton = process.env.GITHUB_TOKEN ?? "";
  const ageMaxHeures = Number(process.env.AGE_MAX_HEURES ?? 26);
  const preuve = process.env.PREUVE ?? "preuves/sauvegarde-hors-site.json";

  if (!depot || !jeton) {
    console.error("GITHUB_REPOSITORY et GITHUB_TOKEN sont requis.");
    process.exit(2);
  }

  const reponse = await fetch(
    `https://api.github.com/repos/${depot}/actions/artifacts?per_page=100`,
    {
      headers: {
        authorization: `Bearer ${jeton}`,
        accept: "application/vnd.github+json",
        "x-github-api-version": "2022-11-28",
      },
    },
  );
  if (!reponse.ok) {
    console.error(`API GitHub : HTTP ${reponse.status}`);
    process.exit(2);
  }
  const charge = await reponse.json();
  const maintenant = new Date();
  const etat = etatCopieHorsSite(charge.artifacts, maintenant, ageMaxHeures);

  const sortie = {
    verifieLe: maintenant.toISOString(),
    depot,
    ageMaxHeures,
    ...etat,
  };
  writeFileSync(preuve, `${JSON.stringify(sortie, null, 2)}\n`);
  console.log(JSON.stringify(sortie));

  if (!etat.conforme) {
    console.error(
      etat.present
        ? `Copie hors-site trop ancienne : ${etat.ageHeures} h (max ${ageMaxHeures} h).`
        : "Aucune copie hors-site trouvée.",
    );
    process.exit(1);
  }
}

if (
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  await principal();
}
