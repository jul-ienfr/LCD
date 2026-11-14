/**
 * Purge des données de recette (faux comptes, faux logements) — **opération de
 * déploiement, après le déploiement** : `v2/DEPLOIEMENT.md` § 8, friction R-11.
 *
 * Le script est **en lecture seule par défaut** : il affiche le plan (ce qu'il
 * supprimerait, avec les volumes) et ne touche à rien. Pour exécuter :
 *
 *   NETTOYAGE_CONFIRME=1 node scripts/nettoyer-donnees-recette.mjs --appliquer
 *
 * Trois verrous avant toute écriture : le drapeau `--appliquer`, la variable
 * `NETTOYAGE_CONFIRME=1`, et un nom de base qui ressemble à une base de recette
 * (`demo`, `test`, `recette`…) — sinon il faut `NETTOYAGE_FORCER=1`.
 *
 * Conservés : les trois logements de vitrine et un compte administrateur
 * (`NETTOYAGE_CONSERVER_EMAIL`, `super@lcd.test` par défaut).
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import {
  CONSERVER_EMAIL_DEFAUT,
  estCompteDeRecette,
  estLogementDeRecette,
  nomBaseRessembleARecette,
  ordreEtapes,
} from "./lib/donnees-recette.mjs";

const require = createRequire(`${process.cwd()}/package.json`);
const postgres = require("postgres");

const args = process.argv.slice(2);
if (args.includes("--aide") || args.includes("-h")) {
  console.log(
    [
      "Usage : node scripts/nettoyer-donnees-recette.mjs [--plan | --appliquer]",
      "",
      "  --plan       (défaut) affiche le plan, ne supprime rien",
      "  --appliquer  exécute la purge (exige NETTOYAGE_CONFIRME=1)",
      "",
      "Variables : MIGRATION_DATABASE_URL (ou DATABASE_URL),",
      "            SEED_DEMO_TENANT_SLUG (défaut lcd),",
      "            NETTOYAGE_CONSERVER_EMAIL (défaut super@lcd.test),",
      "            NETTOYAGE_CONFIRME=1, NETTOYAGE_FORCER=1.",
    ].join("\n"),
  );
  process.exit(0);
}

const appliquer = args.includes("--appliquer");
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error(
    "MIGRATION_DATABASE_URL (ou DATABASE_URL) est requis : la purge doit passer par un rôle qui voit toutes les lignes.",
  );
  process.exit(2);
}
const nomBase = new URL(url).pathname.replace(/^\//, "");
const slug = process.env.SEED_DEMO_TENANT_SLUG ?? "lcd";
const conserver = process.env.NETTOYAGE_CONSERVER_EMAIL ?? CONSERVER_EMAIL_DEFAUT;

if (appliquer && process.env.NETTOYAGE_CONFIRME !== "1") {
  console.error(
    "Refus : NETTOYAGE_CONFIRME=1 est requis pour écrire. Sauvegardez d'abord la base (v2/BACKUPS.md).",
  );
  process.exit(2);
}
if (appliquer && !nomBaseRessembleARecette(nomBase) && process.env.NETTOYAGE_FORCER !== "1") {
  console.error(
    `Refus : « ${nomBase} » ne ressemble pas à une base de recette. Posez NETTOYAGE_FORCER=1 si c'est bien la bonne cible.`,
  );
  process.exit(2);
}

const sql = postgres(url, { max: 1 });
const [tenant] = await sql`select id, slug from tenants where slug = ${slug} limit 1`;
if (!tenant) {
  console.error(`Tenant « ${slug} » introuvable : rien à purger.`);
  await sql.end();
  process.exit(2);
}

const logements = await sql`select id, code, nom from logements where tenant_id = ${tenant.id}`;
const comptes = await sql`select id, email from users where tenant_id = ${tenant.id}`;
const aSupprimer = logements.filter(estLogementDeRecette).map((l) => l.id);
const comptesASupprimer = comptes
  .filter((c) => estCompteDeRecette(c.email, conserver))
  .map((c) => c.id);
const comptesHorsRecette = comptes.filter((c) => !estCompteDeRecette(c.email, conserver));

console.log(
  `Base ${nomBase} · tenant ${tenant.slug} · ${logements.length} logements, ${comptes.length} comptes`,
);
console.log(
  `Conservés : ${logements.length - aSupprimer.length} logement(s) de vitrine, ${comptesHorsRecette.length} compte(s) (dont ${conserver})`,
);
if (comptesHorsRecette.length > 0) {
  console.log(
    `Comptes non reconnus comme données de recette (jamais supprimés) : ${comptesHorsRecette
      .map((c) => c.email)
      .join(", ")}`,
  );
}

/** Comptes et logements de recette, passés en paramètres aux étapes qui les visent. */
const idsComptes = comptesASupprimer;
const idsLogements = aSupprimer;

const plan = [
  {
    id: "paiements",
    compter: async () => (await sql`select count(*)::int as n from paiements`)[0].n,
    supprimer: async () => (await sql`delete from paiements`).count,
  },
  {
    id: "factures",
    compter: async () => (await sql`select count(*)::int as n from factures`)[0].n,
    supprimer: async () => (await sql`delete from factures`).count,
  },
  {
    id: "reservations",
    compter: async () => (await sql`select count(*)::int as n from reservations`)[0].n,
    supprimer: async () => (await sql`delete from reservations`).count,
  },
  {
    id: "dispatches",
    compter: async () =>
      (await sql`select count(*)::int as n from dispatches where prestataire_id = any(${idsComptes})`)[0].n,
    supprimer: async () =>
      (await sql`delete from dispatches where prestataire_id = any(${idsComptes})`).count,
  },
  {
    id: "missions",
    compter: async () =>
      (
        await sql`select count(*)::int as n from missions
                  where assigned_user_id = any(${idsComptes}) or logement_id = any(${idsLogements})`
      )[0].n,
    supprimer: async () =>
      (
        await sql`delete from missions
                  where assigned_user_id = any(${idsComptes}) or logement_id = any(${idsLogements})`
      ).count,
  },
  {
    id: "comptes",
    compter: async () => comptesASupprimer.length,
    supprimer: async () => (await sql`delete from users where id = any(${idsComptes})`).count,
  },
  {
    id: "logements",
    compter: async () => aSupprimer.length,
    supprimer: async () => (await sql`delete from logements where id = any(${idsLogements})`).count,
  },
];

const ordre = ordreEtapes();
const coherent = plan.map((etape) => etape.id).join(",") === ordre.join(",");
if (!coherent) {
  console.error(
    `Incohérence interne : l'ordre du script (${plan.map((e) => e.id).join(",")}) diffère de scripts/lib/donnees-recette.mjs (${ordre.join(",")}).`,
  );
  await sql.end();
  process.exit(3);
}

if (!appliquer) {
  console.log("\nPlan (lecture seule — rien n'a été supprimé) :");
  for (const etape of plan) {
    console.log(`  ${etape.id.padEnd(13)} ${String(await etape.compter()).padStart(6)} ligne(s)`);
  }
  console.log(
    "\nPour exécuter : NETTOYAGE_CONFIRME=1 npm run db:nettoyer-recette -- --appliquer\n" +
      "(la base doit d'abord être sauvegardée — v2/BACKUPS.md)",
  );
  await sql.end();
  process.exit(0);
}

console.log("\nPurge :");
await sql.begin(async (tx) => {
  await tx`select set_config('app.tenant_id', ${tenant.id}, true)`;
  for (const etape of plan) {
    const supprimees = await etape.supprimer();
    console.log(`  ${etape.id.padEnd(13)} ${String(supprimees).padStart(6)} ligne(s) supprimée(s)`);
  }
});

const [restants] = await sql`
  select (select count(*)::int from users where tenant_id = ${tenant.id}) as comptes,
         (select count(*)::int from logements where tenant_id = ${tenant.id}) as logements`;
console.log(
  `\nAprès purge : ${restants.logements} logement(s) (attendu 3), ${restants.comptes} compte(s) (attendu 1).`,
);
await sql.end();