/**
 * Import V1 → V2 avec journal de correspondance (spec 005, US3).
 *
 *   npm run migration:simulation   # défaut : aucune écriture en base
 *   npm run migration:appliquer    # écrit tenant, logements et journal
 *
 * Garanties :
 *   - sources ouvertes en lecture seule, empreinte SHA-256 avant/après ;
 *   - une ligne `migration_v1` par enregistrement source, statut explicite ;
 *   - relance idempotente : même empreinte = `inchange`, aucune écriture ;
 *   - une cible préexistante divergente n'est jamais écrasée silencieusement.
 */
import { config } from "dotenv";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import postgres from "postgres";
import type {
  ConstatFinancier,
  DecisionExclusion,
  LogementCible,
  PlanImport,
  StatutJournal,
  TenantCible,
} from "./mapper";
import { construirePlan, statutEcriture } from "./mapper";
import { chargerSources, verifierSourcesIntactes } from "./sources";

config({ path: ".env.local", quiet: true });

interface Options {
  appliquer: boolean;
  sources: string;
  sortie: string;
  slug: string;
}

function lireOptions(argv: string[]): Options {
  const valeur = (nom: string, defaut: string): string => {
    const index = argv.indexOf(nom);
    if (index >= 0 && argv[index + 1]) return argv[index + 1] as string;
    return defaut;
  };
  return {
    appliquer: argv.includes("--appliquer"),
    sources: resolve(valeur("--sources", "../custom")),
    sortie: resolve(valeur("--sortie", "../docs/ops/migration-2026-11")),
    slug: valeur("--slug", process.env.LCD_TENANT_SLUG ?? "lcd"),
  };
}

interface LigneRapport {
  source: string;
  cleSource: string;
  cible: string;
  idCible: string;
  empreinte: string;
  statut: StatutJournal;
  motif: string | null;
}

interface ResultatCible {
  idCible: string;
  statut: StatutJournal;
  motif: string | null;
}

type Tx = postgres.TransactionSql;

function masquerBase(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}:${u.port || "5432"}${u.pathname}`;
  } catch {
    return "base non reconnue";
  }
}

function urlBase(): string {
  const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "MIGRATION_DATABASE_URL ou DATABASE_URL est requis (fichier .env.local).",
    );
  }
  return url;
}

function egal(a: unknown, b: unknown): boolean {
  const normaliser = (v: unknown): unknown =>
    v === undefined || v === "" ? null : v;
  return normaliser(a) === normaliser(b);
}

async function ecrireTenant(
  tx: Tx,
  tenant: TenantCible,
  appliquer: boolean,
): Promise<ResultatCible> {
  const existants = await tx<
    Array<{
      id: string;
      nom: string;
      nature: string;
      regime: string;
      tva: string;
      siren: string | null;
    }>
  >`select id, nom, nature, regime, tva, siren from tenants where slug = ${tenant.slug} limit 1`;

  const existant = existants[0];
  if (!existant) {
    if (!appliquer) return { idCible: "(nouveau)", statut: "a_importer", motif: null };
    const crees = await tx<Array<{ id: string }>>`
      insert into tenants (slug, nom, nature, regime, tva, siren)
      values (${tenant.slug}, ${tenant.nom}, ${tenant.nature}, ${tenant.regime}, ${tenant.tva}, ${tenant.siren})
      returning id`;
    return { idCible: crees[0]?.id ?? "?", statut: "importe", motif: null };
  }

  const identique =
    egal(existant.nom, tenant.nom) &&
    egal(existant.nature, tenant.nature) &&
    egal(existant.regime, tenant.regime) &&
    egal(existant.tva, tenant.tva) &&
    egal(existant.siren, tenant.siren);

  if (identique) {
    return {
      idCible: existant.id,
      statut: "inchange",
      motif: "Cible préexistante identique — aucune écriture.",
    };
  }

  if (!appliquer) {
    return {
      idCible: existant.id,
      statut: "mis_a_jour",
      motif: "Simulation : la cible serait mise à jour depuis la source.",
    };
  }

  await tx`
    update tenants
       set nom = ${tenant.nom},
           nature = ${tenant.nature},
           regime = ${tenant.regime},
           tva = ${tenant.tva},
           siren = ${tenant.siren},
           updated_at = now()
     where id = ${existant.id}`;
  return { idCible: existant.id, statut: "mis_a_jour", motif: null };
}

async function ecrireLogement(
  tx: Tx,
  tenantId: string | null,
  logement: LogementCible,
  appliquer: boolean,
): Promise<ResultatCible> {
  if (!tenantId) {
    if (!appliquer) {
      return {
        idCible: "(nouveau)",
        statut: "a_importer",
        motif: "Tenant à créer lors de l'application.",
      };
    }
    return {
      idCible: "-",
      statut: "erreur",
      motif: "Tenant introuvable : logement non importable.",
    };
  }

  const existants = await tx<
    Array<{
      id: string;
      nom: string;
      adresse: string | null;
      strategie_prix: string;
      publication: string;
      copro_verifiee: boolean;
    }>
  >`select id, nom, adresse, strategie_prix, publication, copro_verifiee
      from logements where tenant_id = ${tenantId} and code = ${logement.code} limit 1`;

  const existant = existants[0];
  const identique =
    existant !== undefined &&
    egal(existant.nom, logement.nom) &&
    egal(existant.adresse, logement.adresse) &&
    egal(existant.strategie_prix, logement.strategiePrix) &&
    egal(existant.publication, logement.publication) &&
    existant.copro_verifiee === logement.coproVerifiee;

  if (existant && identique) {
    return {
      idCible: existant.id,
      statut: "inchange",
      motif: "Cible préexistante identique — aucune écriture.",
    };
  }

  if (!appliquer) {
    return {
      idCible: existant?.id ?? "(nouveau)",
      statut: existant ? "mis_a_jour" : "a_importer",
      motif: null,
    };
  }

  if (existant) {
    await tx`
      update logements
         set nom = ${logement.nom},
             adresse = ${logement.adresse},
             strategie_prix = ${logement.strategiePrix},
             publication = ${logement.publication},
             copro_verifiee = ${logement.coproVerifiee},
             updated_at = now()
       where id = ${existant.id}`;
    return { idCible: existant.id, statut: "mis_a_jour", motif: null };
  }

  const crees = await tx<Array<{ id: string }>>`
    insert into logements
      (tenant_id, code, nom, adresse, strategie_prix, publication, copro_verifiee, statut)
    values
      (${tenantId}, ${logement.code}, ${logement.nom}, ${logement.adresse},
       ${logement.strategiePrix}, ${logement.publication}, ${logement.coproVerifiee}, 'actif')
    returning id`;
  return { idCible: crees[0]?.id ?? "?", statut: "importe", motif: null };
}

async function journaliser(
  tx: Tx,
  ligne: LigneRapport,
  appliquer: boolean,
): Promise<void> {
  if (!appliquer) return;
  await tx`
    insert into migration_v1
      (source, cle_source, cible, id_cible, empreinte, statut, motif)
    values
      (${ligne.source}, ${ligne.cleSource}, ${ligne.cible}, ${ligne.idCible},
       ${ligne.empreinte}, ${ligne.statut}, ${ligne.motif})
    on conflict (source, cle_source, cible) do update
      set id_cible = excluded.id_cible,
          empreinte = excluded.empreinte,
          statut = excluded.statut,
          motif = excluded.motif,
          maj_le = now()`;
}

async function chargerJournal(
  tx: Tx,
): Promise<Map<string, { empreinte: string; idCible: string }>> {
  const lignes = await tx<
    Array<{ source: string; cle_source: string; cible: string; empreinte: string; id_cible: string }>
  >`select source, cle_source, cible, empreinte, id_cible from migration_v1`;
  return new Map(
    lignes.map((l) => [
      `${l.source}|${l.cle_source}|${l.cible}`,
      { empreinte: l.empreinte, idCible: l.id_cible },
    ]),
  );
}

function decider(
  journal: Map<string, { empreinte: string; idCible: string }>,
  source: string,
  cleSource: string,
  cible: string,
  empreinte: string,
): "creer" | "inchange" | "mettre_a_jour" {
  const existant = journal.get(`${source}|${cleSource}|${cible}`);
  return statutEcriture({
    journalExiste: existant !== undefined,
    empreinteJournal: existant?.empreinte ?? null,
    empreinteSource: empreinte,
  });
}

function echapperCsv(valeur: string | null): string {
  const texte = valeur ?? "";
  return /[",\n;]/.test(texte) ? `"${texte.replaceAll('"', '""')}"` : texte;
}

function rapportMarkdown(argument: {
  date: string;
  mode: string;
  base: string;
  racineSources: string;
  lignes: LigneRapport[];
  constats: ConstatFinancier[];
  anomalies: string[];
  sourcesIntactes: boolean;
  slug: string;
}): string {
  const parStatut = new Map<string, number>();
  for (const ligne of argument.lignes) {
    parStatut.set(ligne.statut, (parStatut.get(ligne.statut) ?? 0) + 1);
  }
  const compteur = (statut: string): number => parStatut.get(statut) ?? 0;
  const importes = argument.lignes.filter(
    (l) => l.statut === "importe" || l.statut === "mis_a_jour",
  );
  const erreurs = argument.lignes.filter((l) => l.statut === "erreur");
  const secondPassage =
    argument.mode === "application" &&
    compteur("importe") === 0 &&
    compteur("mis_a_jour") === 0 &&
    erreurs.length === 0;

  return [
    "# Rapport de migration V1 → V2",
    "",
    "```text",
    "Statut : ACTIF",
    "Propriétaire : exploitation",
    `Dernière vérification : ${argument.date}`,
    "Remplace / remplacé par : —",
    "Source de vérité : specs/005-mise-en-production/spec.md (US3)",
    "```",
    "",
    `- **Date d'exécution** : ${argument.date}`,
    `- **Mode** : ${argument.mode}`,
    `- **Base** : \`${argument.base}\``,
    `- **Tenant** : \`${argument.slug}\``,
    `- **Sources** : \`${argument.racineSources}\``,
    `- **Script** : \`v2/scripts/migration-v1/importer.ts\` (table \`migration_v1\`)`,
    "",
    "## 1. Résultat",
    "",
    "| Statut | Nombre |",
    "| --- | ---: |",
    `| importé | ${compteur("importe")} |`,
    `| mis à jour | ${compteur("mis_a_jour")} |`,
    `| inchangé | ${compteur("inchange")} |`,
    `| à importer (simulation) | ${compteur("a_importer")} |`,
    `| exclu avec motif | ${compteur("exclu")} |`,
    `| erreur | ${compteur("erreur")} |`,
    "",
    secondPassage
      ? "Second passage idempotent : aucune création, aucune mise à jour, zéro erreur."
      : `${importes.length} enregistrement(s) écrit(s) ou à écrire, ${erreurs.length} erreur(s).`,
    "",
    "## 2. Détail par enregistrement",
    "",
    "| Source | Clé | Cible | Id cible | Statut | Motif |",
    "| --- | --- | --- | --- | --- | --- |",
    ...argument.lignes.map(
      (l) =>
        `| \`${l.source}\` | \`${l.cleSource}\` | ${l.cible} | ${l.idCible} | ${l.statut} | ${l.motif ?? ""} |`,
    ),
    "",
    "## 3. Constats financiers disponibles",
    "",
    "| Logement | Prix de base | Prix min | Prix max | Commission |",
    "| --- | ---: | ---: | ---: | ---: |",
    ...(argument.constats.length === 0
      ? ["| — | — | — | — | — |"]
      : argument.constats.map(
          (c) =>
            `| ${c.logement} | ${c.prixBase ?? "—"} € | ${c.prixMin ?? "—"} € | ${c.prixMax ?? "—"} € | ${c.commissionPct ?? "—"} % |`,
        )),
    "",
    "Aucune ligne `tarifs` n'est créée : la source ne contient aucune date, et",
    "un prix sans date serait une invention. Les bornes restent la référence",
    "de saisie dans V2.",
    "",
    "## 4. Anomalies et écarts",
    "",
    ...(argument.anomalies.length === 0
      ? ["Aucune anomalie détectée."]
      : argument.anomalies.map((a) => `- ${a}`)),
    "",
    "## 5. Intégrité",
    "",
    `- Sources intactes après import : ${argument.sourcesIntactes ? "oui (SHA-256 identique)" : "NON — écart détecté"}`,
    "- Secrets, état runtime et infrastructure : jamais ouverts.",
    "- Mots de passe V1 : aucun migré, réinvitation obligatoire.",
    "- Données de démonstration : aucune importée (le tenant et les logements",
    "  sont filtrés par les règles de `mapper.ts`).",
    "",
    "## 6. Suite",
    "",
    "1. Rejouer ce rapport sur une copie de production (T113).",
    "2. Comparer deux copies et signer les écarts (T114).",
    "3. Recréer les comptes par invitation, activer la 2FA.",
    "4. Saisir les tarifs datés dans V2 à partir des bornes ci-dessus.",
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  const options = lireOptions(process.argv.slice(2));
  const chargement = chargerSources(options.sources);
  const plan: PlanImport = construirePlan(chargement.sources, {
    slugTenant: options.slug,
  });

  const lignes: LigneRapport[] = [];
  const anomalies = [...plan.anomalies];
  const d = new Date();
  const deux = (n: number): string => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
  const url = urlBase();
  const base = masquerBase(url);
  const sql = postgres(url, { max: 1, onnotice: () => {} });

  try {
    const table = await sql<Array<{ existe: string | null }>>`
      select to_regclass('public.migration_v1')::text as existe`;
    if (!table[0]?.existe) {
      throw new Error(
        "Table migration_v1 absente : exécuter `npm run db:migrate` avant l'import.",
      );
    }

    await sql.begin(async (tx) => {
      const journal = await chargerJournal(tx);

      if (plan.tenant) {
        const decision = decider(
          journal,
          "entites.yaml",
          plan.tenant.cleSource,
          "tenants",
          plan.tenant.empreinte,
        );
        let resultat: ResultatCible;
        if (decision === "inchange") {
          const [existant] = await tx<Array<{ id: string }>>`
            select id from tenants where slug = ${plan.tenant.slug} limit 1`;
          resultat = existant
            ? {
                idCible: existant.id,
                statut: "inchange",
                motif: "Empreinte identique au journal.",
              }
            : await ecrireTenant(tx, plan.tenant, options.appliquer);
        } else {
          resultat = await ecrireTenant(tx, plan.tenant, options.appliquer);
          if (decision === "mettre_a_jour" && resultat.statut === "inchange") {
            resultat = { ...resultat, statut: "mis_a_jour", motif: null };
          }
        }
        lignes.push({
          source: "entites.yaml",
          cleSource: plan.tenant.cleSource,
          cible: "tenants",
          idCible: resultat.idCible,
          empreinte: plan.tenant.empreinte,
          statut: resultat.statut,
          motif: resultat.motif,
        });
        await journaliser(
          tx,
          {
            source: "entites.yaml",
            cleSource: plan.tenant.cleSource,
            cible: "tenants",
            idCible: resultat.idCible,
            empreinte: plan.tenant.empreinte,
            statut: resultat.statut,
            motif: resultat.motif,
          },
          options.appliquer,
        );
      }

      const tenantId = await (async (): Promise<string | null> => {
        if (!plan.tenant) return null;
        const [ligne] = await tx<Array<{ id: string }>>`
          select id from tenants where slug = ${plan.tenant.slug} limit 1`;
        return ligne?.id ?? null;
      })();

      for (const logement of plan.logements) {
        const decision = decider(
          journal,
          "logements.yaml",
          logement.cleSource,
          "logements",
          logement.empreinte,
        );
        let resultat: ResultatCible;
        if (decision === "inchange") {
          const [existant] = await tx<Array<{ id: string }>>`
            select id from logements
             where tenant_id = ${tenantId} and code = ${logement.code} limit 1`;
          resultat = existant
            ? {
                idCible: existant.id,
                statut: "inchange",
                motif: "Empreinte identique au journal.",
              }
            : await ecrireLogement(tx, tenantId, logement, options.appliquer);
        } else {
          resultat = await ecrireLogement(tx, tenantId, logement, options.appliquer);
          if (decision === "mettre_a_jour" && resultat.statut === "inchange") {
            resultat = { ...resultat, statut: "mis_a_jour", motif: null };
          }
        }
        lignes.push({
          source: "logements.yaml",
          cleSource: logement.cleSource,
          cible: "logements",
          idCible: resultat.idCible,
          empreinte: logement.empreinte,
          statut: resultat.statut,
          motif: resultat.motif,
        });
        await journaliser(
          tx,
          {
            source: "logements.yaml",
            cleSource: logement.cleSource,
            cible: "logements",
            idCible: resultat.idCible,
            empreinte: logement.empreinte,
            statut: resultat.statut,
            motif: resultat.motif,
          },
          options.appliquer,
        );
      }

      for (const exclusion of plan.exclusions) {
        const ligne = exclusionEnLigne(exclusion);
        lignes.push(ligne);
        await journaliser(tx, ligne, options.appliquer);
      }
    });
  } finally {
    await sql.end({ timeout: 5 });
  }

  const integrite = verifierSourcesIntactes(chargement);
  if (!integrite.ok) {
    anomalies.push(...integrite.ecarts);
  }

  const erreurs = lignes.filter((l) => l.statut === "erreur");
  mkdirSync(options.sortie, { recursive: true });
  const rapport = rapportMarkdown({
    date,
    mode: options.appliquer ? "application" : "simulation",
    base,
    racineSources: chargement.racine,
    lignes,
    constats: plan.constatsFinanciers,
    anomalies,
    sourcesIntactes: integrite.ok,
    slug: options.slug,
  });
  writeFileSync(join(options.sortie, "rapport-reconciliation.md"), `${rapport}\n`, "utf8");
  writeFileSync(
    join(options.sortie, "rapport-reconciliation.json"),
    `${JSON.stringify({ date, mode: options.appliquer ? "application" : "simulation", base, lignes, constats: plan.constatsFinanciers, anomalies, sourcesIntactes: integrite.ok }, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    join(options.sortie, "journal-import.csv"),
    [
      "source;cle_source;cible;id_cible;empreinte;statut;motif",
      ...lignes.map((l) =>
        [l.source, l.cleSource, l.cible, l.idCible, l.empreinte, l.statut, l.motif]
          .map(echapperCsv)
          .join(";"),
      ),
      "",
    ].join("\n"),
    "utf8",
  );

  const compte = (statut: string): number =>
    lignes.filter((l) => l.statut === statut).length;
  console.log(
    `${options.appliquer ? "Import appliqué" : "Simulation"} — ${lignes.length} lignes : ` +
      `${compte("importe")} importées, ${compte("mis_a_jour")} mises à jour, ` +
      `${compte("inchange")} inchangées, ${compte("a_importer")} à importer, ` +
      `${compte("exclu")} exclues, ${erreurs.length} erreurs.`,
  );
  console.log(`Rapport : ${join(options.sortie, "rapport-reconciliation.md")}`);

  if (!integrite.ok || erreurs.length > 0) process.exitCode = 1;
}

function exclusionEnLigne(exclusion: DecisionExclusion): LigneRapport {
  return {
    source: exclusion.source,
    cleSource: exclusion.cleSource,
    cible: exclusion.cible,
    idCible: exclusion.idCible,
    empreinte: exclusion.empreinte,
    statut: "exclu",
    motif: exclusion.motif,
  };
}

main().catch((erreur) => {
  console.error(erreur instanceof Error ? erreur.message : String(erreur));
  process.exitCode = 1;
});
